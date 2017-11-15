var request = require('request')
var safeParse = require('safe-json-parse/callback')
var parseXMLString = require('xml2js').parseString
const EventEmitter = require('events')

var PlexServer = require('./PlexServer.js')
var PlexTv = require('./PlexTv.js')
var PlexConnection = require('./PlexConnection.js')
var _PlexAuth = require('./PlexAuth.js')
var PlexAuth = new _PlexAuth()

module.exports = function PlexClient () {
  this.commandId = 0
  this.name = null
  this.product = null
  this.productVersion = null
  this.platform = null
  this.platformVersion = null
  this.device = null
  this.clientIdentifier = null
  this.createdAt = null
  this.lastSeenAt = null
  this.provides = null
  this.owned = null
  this.publicAddressMatches = null
  this.presence = null
  this.plexConnections = null
  this.chosenConnection = null
  this.httpServer = null
  this.tempId = null
  this.events = new EventEmitter()

  this.userData = null

  // Latest objects for reference in the future
  this.lastRatingKey = null
  this.lastTimelineObject = null
  this.oldTimelineObject = null
  this.lastTimeline = null
  this.oldTimeline = null
  this.clientPlayingMetadata = null
  this.lastSubscribe = 0
  this.connectedstatus = 'fresh'

  this.eventbus = window.EventBus // Assigned early on - we will use this to communicate with the PT Player
  this.commit = null

  this.setValue = function (key, value) {
    this[key] = value
    this.commit('PLEX_CLIENT_SET_VALUE', [this, key, value])
  }
  // Functions
  this.generateGuid = function () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }

    return s4() + s4() + '-' + s4()
  }
  this.uuid = this.generateGuid()

  this.hitApi = function (command, params, connection, commit) {

    return new Promise(async (resolve, reject) => {
      if (this.clientIdentifier == 'PTPLAYER9PLUS10') {
        // We are using the PT Player
  
        let data = {
          command: command,
          params: params,
          callback: function (resultData) {
            resolve(resultData, 0, 200, 'PTPLAYER')
          }
        }
        this.eventbus.$emit('command', data)
  
      } else {
        const doRequest = () => {
          if (!connection) {
            if (!this.chosenConnection) {
              console.log('You should find a working connection via #findConnection first!')
            }
            connection = this.chosenConnection
          }
          var query = 'type=video&'
          for (let key in params) {
            query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
          }
          query = query + 'commandID=' + this.commandId
          if (connection.uri.charAt(connection.uri.length - 1) == '/') {
            //Remove a trailing / that some clients broadcast
            connection.uri = connection.uri.slice(0, connection.uri.length - 1)
          }
          var _url = connection.uri + command + '?' + query
          this.setValue('commandId', this.commandId + 1)
          var options = PlexAuth.getClientApiOptions(_url, this.clientIdentifier, this.uuid, 5000)
          // console.log('sending api request', options)
          request(options, (error, response, body) => {
            // console.log('response data', response)
            if (error) {
              return reject(error)
              
            } else {
              parseXMLString(body, function (err, result) {
                if (err || (response.statusCode != 200 && response.statusCode != 201)) {
                  return reject(err || response.statusCode)
                }
                return resolve(result, response.elapsedTime, response.statusCode, connection)
            })
            }
          })
        }
        if ((new Date().getTime() - this.lastSubscribe) > 29000) {
            // We need to subscribe first!
            let result = await this.subscribe(connection, commit)
            // console.log('Got subscription result', result)
            // if (result) {
              // commit('PLEX_CLIENT_SET_VALUE', [this, 'lastSubscribe', new Date().getTime()])
              //lastSubscribe = new Date().getTime()
            // }
            //console.log('subscription result: ' + result)
            doRequest()
            return
          
        } else {
          doRequest()
          return
        } 
      }
    })
  }

  this.getTimeline = async function (callback) {
    //Get the timeline object from the client

    let data
    try {
      data = await this.hitApi('/player/timeline/poll', {'wait': 0}, this.chosenConnection)    
      // console.log('Timeline result', data)
      if (data) {
        return this.updateTimelineObject(data)
      } else {
        return false
      }
    } catch (e) {
      console.log(e)
      return false
    }

    // this.hitApi('/player/timeline/poll', {'wait': 0}, this.chosenConnection, (result, responseTime) => {

    //   if (result) {
    //     if (that.clientIdentifier == 'PTPLAYER9PLUS10') {
    //       that.updateTimelineObject(result, -1, function () {
    //         return callback(result, 0)
    //       })
    //       return
    //     }
    //     //console.log(JSON.stringify(result,null,4))
    //     //Valid response back from the client
    //     if (result.MediaContainer != null) {
    //       that.updateTimelineObject(result, responseTime, function () {
    //         return callback(result, responseTime)
    //       })
    //       //return (callback(result.MediaContainer.Timeline,responseTime))
    //     } else {
    //       return callback(null, responseTime)
    //     }
    //   } else {
    //     return callback(false, responseTime)
    //   }
    // })
  }

  this.updateTimelineObject = function (result) {



    this.setValue('lastTimelineObject', result)
    this.lastTimelineObject = result    
    this.events.emit('new_timeline', result)

    // Check if we are the PTPlayer
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      // PTPLAYER
      this.events.emit('new_timeline', result)
      //console.log(result)
      var clonetimeline = this.lastTimelineObject

      if (!this.oldTimelineObject) {
        if (!this.lastTimelineObject.ratingKey) {
          this.events.emit('playback_change', null)
        } else {
          this.events.emit('playback_change', this.lastTimelineObject.ratingKey)
        }
        this.setValue('oldTimelineObject', result)
        // this.oldTimelineObject = result
        return callback(result)
      }
      this.setValue('oldTimelineObject', clonetimeline)
      // this.oldTimelineObject = clonetimeline
      if (this.oldTimelineObject.ratingKey != this.lastTimelineObject.ratingKey) {
        if (!this.lastTimelineObject.ratingKey) {
          this.events.emit('playback_change', null)
        } else {
          this.events.emit('playback_change', this.lastTimelineObject.ratingKey)
        }
      }
      return true
    }    

    if (!result.MediaContainer.Timeline) {
      // Not a valid timeline object
      return false
    }
    // Valid timeline data

    // Standard player
    let timelines = result.MediaContainer.Timeline
    let videoTimeline = null
    for (let i = 0; i < timelines.length; i++) {
      let _timeline = timelines[i]['$']
      if (_timeline.type == 'video'){
        videoTimeline = _timeline
      }
      if ((_timeline.state && _timeline.state != 'stopped') || i == (timelines.length - 1)) {
        this.events.emit('new_timeline', timelines[i]['$'])
        var clonetimeline = this.lastTimelineObject
        this.lastTimelineObject = timelines[i]['$'] 
        this.setValue('lastTimelineObject', timelines[i]['$'])
        if (!this.oldTimelineObject) {
          // First time we've got data!
          if (!this.lastTimelineObject.ratingKey) {
            this.events.emit('playback_change', null)
          } else {
            this.events.emit('playback_change', this.lastTimelineObject.ratingKey)
          }
          this.setValue('oldTimelineObject', timelines[i]['$'])
          // this.oldTimelineObject = timelines[i]['$']
          return timelines[i]['$']
        }
        this.setValue('oldTimelineObject', clonetimeline)
        this.oldTimelineObject = clonetimeline
        if (this.oldTimelineObject.ratingKey != result.ratingKey) {
          if (!this.lastTimelineObject.ratingKey) {
            this.events.emit('playback_change', null)
          } else {
            this.events.emit('playback_change', result.ratingKey)
          }
        }
        return timelines[i]['$']
      }
    }
    return videoTimeline
  }
  this.pressPlay = function (callback) {
    //Press play on the client
    this.hitApi('/player/playback/play', {'wait': 0}, this.chosenConnection, function (result, responseTime) {
      if (result) {
        //Valid response back from the client
        return callback(result, responseTime)
      } else {
        return callback(null)
      }
    })
  }

  this.pressPause = function (callback) {
    //Press pause on the client
    this.hitApi('/player/playback/pause', {'wait': 0}, this.chosenConnection, function (result, responseTime) {
      if (result) {
        //Valid response back from the client
        return callback(result, responseTime)
      } else {
        return callback(null)
      }
    })
  }
  this.pressStop = function (callback) {
    //Press pause on the client
    this.hitApi('/player/playback/stop', {'wait': 0}, this.chosenConnection, function (result, responseTime) {
      if (result) {
        //Valid response back from the client
        return callback(result, responseTime)
      } else {
        return callback(null)
      }
    })
  }
  this.seekTo = function (time, callback) {
    //Seek to a time (in ms)
    this.hitApi('/player/playback/seekTo', {
      'wait': 0,
      'offset': time
    }, this.chosenConnection, function (result, responseTime) {
      if (result) {
        //Valid response back from the client
        return callback(result, responseTime)
      } else {
        return callback(null)
      }
    })
  }

  this.getRatingKey = function (callback) {
    //Get the ratingKey, aka the mediaId, of the item playing
    this.hitApi('/player/timeline/poll', {'wait': 0}, this.chosenConnection, function (result) {
      if (result) {
        //Valid response back from the client
        var allTimelines = result.MediaContainer.Timeline
        for (var i in allTimelines) {
          var timeline = allTimelines[i]['$']
          //We only want the rating key of whatever is playing in the video timeline
          if (timeline.type == 'video') {
            return callback(timeline.ratingKey)
          }
        }
        return callback(null)
      } else {
        return callback(null)
      }
    })
  }

  this.getServerId = function (callback) {
    //Get the machineId of the server we're playing from'
    this.hitApi('/player/timeline/poll', {'wait': 0}, this.chosenConnection, function (result) {
      if (result) {
        //Valid response back from the client
        var allTimelines = result.MediaContainer.Timeline
        for (var i in allTimelines) {
          var timeline = allTimelines[i]['$']
          //We only want the rating key of whatever is playing in the video timeline
          if (timeline.type == 'video') {
            return callback(timeline.machineIdentifier)
          }
        }
        return callback(null)
      } else {
        return callback(null)
      }
    })
  }

  this.getPlayerState = function (callback) {
    //Get the Player State (playing, paused or stopped)
    this.hitApi('/player/timeline/poll', {'wait': 0}, this.chosenConnection, function (result) {
      if (result) {
        //Valid response back from the client
        var allTimelines = result.MediaContainer.Timeline
        for (var i in allTimelines) {
          var timeline = allTimelines[i]['$']
          //We only want the rating key of whatever is playing in the video timeline
          if (timeline.type == 'video') {
            return callback(timeline.state)
          }
        }
        return callback(null)
      } else {
        return callback(null)
      }
    })
  }

  this.getPlayerTime = function (callback) {
    //Get the current playback time in ms
    this.hitApi('/player/timeline/poll', {'wait': 0}, this.chosenConnection, function (result, responseTime, code) {
      if (result) {
        //Valid response back from the client
        var allTimelines = result.MediaContainer.Timeline
        for (var i in allTimelines) {
          var timeline = allTimelines[i]['$']
          //We only want the rating key of whatever is playing in the video timeline
          if (timeline.type == 'video') {
            return callback(timeline.time, responseTime)
          }
        }
        return callback(null, responseTime)
      } else {
        return callback(null, responseTime)
      }
    })
  }

  this.playMedia = function (data) {
    //Play a media item given a mediaId key and a server to play from
    //We need the following variables to build our paramaters:
    //MediaId Key, Offset (0 for simplicity), server MachineId,
    //Server Ip, Server Port, Server Protocol, Path
    var that = this
    console.log(data)
    // First lets mirror the item so the user has an idea of what we're about to play

    function send () {
      let command = '/player/playback/playMedia'
      let mediaId = '/library/metadata/' + data.ratingKey
      let offset = data.offset || 0
      let serverId = data.server.clientIdentifier
      let address = data.server.chosenConnection.address
      let port = data.server.chosenConnection.port
      let protocol = data.server.chosenConnection.protocol
      let path = data.server.chosenConnection.uri + mediaId

      let params = {

        'X-Plex-Client-Identifier': 'PlexTogether',
        'key': mediaId,
        'offset': offset,
        'machineIdentifier': serverId,
        'address': address,
        'port': port,
        'protocol': protocol,
        'path': path,
        'wait': 0,
        'token': data.server.accessToken
      }

      if (data.mediaIndex != undefined || data.mediaIndex != null){
        params.mediaIndex = data.mediaIndex
      }

      //Now that we've built our params, it's time to hit the client api
      that.hitApi(command, params, that.chosenConnection, function (result, the, code) {
        console.log('play result: ')
        console.log(code)
        if (result != null) {
          return data.callback(result, code, that)
        }
        else {
          return data.callback(false, code, that)
        }
        //console.log(that.name + ' returned ' + result)
      })
    }

    if (this.clientIdentifier == 'PTPLAYER9PLUS10') {
      send()
    } else {
      this.mirrorContent(data.ratingKey, data.server, function () {
        send()
      })
    }

  }
  this.mirrorContent = function (key, serverObject, callback) {
    //Mirror a media item given a mediaId key and a server to play from
    //We need the following variables to build our paramaters:
    //MediaId Key, Offset (0 for simplicity), server MachineId,
    //Server Ip, Server Port, Server Protocol, Path
    var that = this
    console.log('Trying to mirror content')

    let command = '/player/mirror/details'
    let mediaId = '/library/metadata/' + key
    let offset = 0
    let serverId = serverObject.clientIdentifier
    let address = serverObject.chosenConnection.address
    let port = serverObject.chosenConnection.port
    let protocol = serverObject.chosenConnection.protocol
    let path = serverObject.chosenConnection.uri + mediaId

    let params = {

      'X-Plex-Client-Identifier': 'PlexTogether',
      'key': mediaId,
      'machineIdentifier': serverId,
      'address': address,
      'port': port,
      'protocol': protocol,
      'path': path,
      'wait': 0,
      'token': serverObject.accessToken
    }
    //Now that we've built our params, it's time to hit the client api
    this.hitApi(command, params, this.chosenConnection, function (result, that, code) {
      if (result != null) {
        return callback(result, code, that)
      }
      else {
        return callback(false, code, that)
      }
    })
  }
  this.subscribe = function (connection, commit) {
    return new Promise((resolve, reject) => {
      const doRequest = () => {
        // Already have a valid http server running, lets send the request
        if (!connection) {
          // It is possible to try to subscribe before we've found a working connection
          connection = this.chosenConnection
        }
        let tempId = 'PlexTogetherWeb'
        var command = '/player/timeline/subscribe'
        var params = {
          'port': '8090',
          'protocol': 'http',
          'X-Plex-Device-Name': 'PlexTogether'
        }
        //Now that we've built our params, it's time to hit the client api
  
        var query = ''
        for (let key in params) {
          query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
        }
        query = query + 'commandID=' + this.commandId
        if (connection.uri.charAt(connection.uri.length - 1) == '/') {
          //Remove a trailing / that some clients broadcast
          connection.uri = connection.uri.slice(0, connection.uri.length - 1)
        }
  
        var _url = connection.uri + command + '?' + query
        // console.log('subscription url: ' + _url)
        this.commandId = this.commandId + 1
        this.setValue('commandId', this.commandId + 1)
        var options = PlexAuth.getClientApiOptions(_url, this.clientIdentifier, this.uuid, 5000)
        request(options, (error, response, body) => {
          // console.log('subscription result', response)
          
          this.setValue('lastSubscribe', new Date().getTime())
          if (error) {
            return reject(error)
          } else {
            return resolve(true)
          }
        })
      }
      doRequest()
    
    })
    
  }
  this.unsubscribe = function (callback) {
    var that = this
    doRequest()

    function doRequest () {
      // Already have a valid http server running, lets send the request
      let tempId = 'PlexTogether'
      var command = '/player/timeline/unsubscribe'
      var params = {
        'port': '8090',
        'protocol': 'http',
        'X-Plex-Device-Name': 'PlexTogether'
      }
      //Now that we've built our params, it's time to hit the client api

      var query = ''
      for (key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      query = query + 'commandID=' + that.commandId
      if (connection.uri.charAt(connection.uri.length - 1) == '/') {
        //Remove a trailing / that some clients broadcast
        connection.uri = connection.uri.slice(0, connection.uri.length - 1)
      }
      if (that.chosenConnection == null) {
        // It is possible to try to subscribe before we've found a working connection
        console.log('Chosen connection has not been set yet.')
        return (callback(false))
      }
      var _url = that.chosenConnection.uri + command + '?' + query
      console.log('subscription url: ' + _url)
      that.commandId = that.commandId + 1
      var options = PlexAuth.getClientApiOptions(_url, that.clientIdentifier, that.uuid, 5000)
      request(options, function (error, response, body) {
        if (!error) {
          return callback(true, that)
        } else {
          return callback(false, that)
        }
      })
    }
  }
}
