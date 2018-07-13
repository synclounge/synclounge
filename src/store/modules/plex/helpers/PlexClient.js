var request = require('request')
var axios = require('axios')
const EventEmitter = require('events')
var parseXMLString = require('xml2js').parseString
var _PlexAuth = require('./PlexAuth.js')
var PlexAuth = new _PlexAuth()
var stringSimilarity = require('string-similarity')

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

  this.eventbus = window.EventBus // We will use this to communicate with the SLPlayer
  this.commit = null
  this.dispatch = null

  let previousTimeline = {}

  this.setValue = function (key, value) {
    this[key] = value
    this.commit('PLEX_CLIENT_SET_VALUE', [this, key, value])
  }

  this.generateGuid = function () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }

    return s4() + s4() + '-' + s4()
  }
  this.uuid = this.generateGuid()

  this.hitApi = function (command, params, connection) {
    return new Promise(async (resolve, reject) => {
      if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
        // We are using the SyncLounge Player
        let data = {
          command: command,
          params: params,
          callback: (resultData) => {
            resolve(resultData)
          }
        }
        this.eventbus.$emit('command', data)
      } else {
        const doRequest = () => {
          if (!connection) {
            connection = this.chosenConnection
          }
          if (!connection) {
            return reject(new Error('No connection specified'))
          }
          var query = ''
          Object.assign(params, {
            type: 'video',
            commandID: this.commandId
          })
          for (let key in params) {
            query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
          }
          if (connection.uri.charAt(connection.uri.length - 1) === '/') {
            // Remove a trailing / that some clients broadcast
            connection.uri = connection.uri.slice(0, connection.uri.length - 1)
          }
          var _url = connection.uri + command + '?' + query
          this.setValue('commandId', this.commandId + 1)
          var options = PlexAuth.getClientApiOptions(_url, this.clientIdentifier, null, 5000)
          request(options, (error, response, body) => {
            if (!error) {
              parseXMLString(body, function (err, result) {
                if (err) {
                  return reject(new Error('Invalid XML'))
                }
                return resolve(result)
              })
            } else {
              return reject(error)
            }
          })
          // // console.log(params)
          // for (let key in params) {
          //   query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
          // }
          // query = query + 'commandID=' + this.commandId
          // if (connection.uri.charAt(connection.uri.length - 1) === '/') {
          //   // Remove a trailing / that some clients broadcast
          //   connection.uri = connection.uri.slice(0, connection.uri.length - 1)
          // }
          // var _url = connection.uri + command + '?' + query
          // this.setValue('commandId', this.commandId + 1)
          // var options = PlexAuth.getClientApiOptions(_url, this.clientIdentifier, this.uuid, 5000)
          // axios.get(connection.uri + command, {
          //   params,
          //   headers: options.headers
          // })
          //   .then((response) => {
          //     parseXMLString(response.data, (err, result) => {
          //       if (err) {
          //         reject(new Error('Invalid XML', err))
          //       }
          //       return resolve(result)
          //     })
          //   })
          //   .catch((error) => {
          //     reject(error)
          //   })
        }
        if ((new Date().getTime() - this.lastSubscribe) > 29000) {
          // We need to subscribe first!
          try {
            await this.subscribe(connection)
            doRequest()
          } catch (e) {
            console.log('Failed to send subscribe command', e)
            doRequest()
          }
        } else {
          doRequest()
        }
      }
    })
  }

  this.getTimeline = function () {
    return new Promise(async (resolve, reject) => {
      let data
      try {
        data = await this.hitApi('/player/timeline/poll', { 'wait': 0 })
        if (data) {
          return resolve(this.updateTimelineObject(data))
        } else {
          return reject(new Error('Invalid data recieved from client'))
        }
      } catch (e) {
        return reject(e)
      }
    })
    // Get the timeline object from the client
  }

  this.updateTimelineObject = function (result) {
    // Check if we are the SLPlayer
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      // SLPLAYER
      let tempObj = {
        MediaContainer: {
          Timeline: [{ ...result }]
        }
      }
      result = tempObj
      if (!previousTimeline.MediaContainer || result.MediaContainer.Timeline[0].ratingKey !== previousTimeline.MediaContainer.Timeline[0].ratingKey) {
        // console.log('Before playback change', result, previousTimeline)
        window.EventBus.$emit('PLAYBACK_CHANGE', [this, result.MediaContainer.Timeline[0].ratingKey, result.MediaContainer.Timeline[0]])
      }
      previousTimeline = tempObj
      this.lastTimelineObject = result.MediaContainer.Timeline[0]
      this.lastTimelineObject.recievedAt = new Date().getTime()
      window.EventBus.$emit('NEW_TIMELINE', result.MediaContainer.Timeline[0])
      return result
    }
    // Standard player
    let timelines = result.MediaContainer.Timeline
    let videoTimeline = {}
    for (let i = 0; i < timelines.length; i++) {
      let _timeline = timelines[i]['$']
      if (_timeline.type === 'video') {
        videoTimeline = _timeline
        if (videoTimeline.ratingKey !== previousTimeline.ratingKey) {
          window.EventBus.$emit('PLAYBACK_CHANGE', [this, videoTimeline.ratingKey, videoTimeline])
        }
      }
    }
    window.EventBus.$emit('NEW_TIMELINE', videoTimeline)
    previousTimeline = videoTimeline
    this.lastTimelineObject = videoTimeline
    this.lastTimelineObject.recievedAt = new Date().getTime()
    // this.setValue('lastTimelineObject', videoTimeline)
    return videoTimeline
  }
  this.pressPlay = function () {
    // Press play on the client
    return this.hitApi('/player/playback/play', { wait: 0 })
  }

  this.pressPause = function () {
    // Press pause on the client
    return this.hitApi('/player/playback/pause', { wait: 0 })
  }
  this.pressStop = function () {
    // Press pause on the client
    return this.hitApi('/player/playback/stop', { wait: 0 })
  }
  this.seekTo = function (time, params) {
    // Seek to a time (in ms)
    return this.hitApi('/player/playback/seekTo', Object.assign({ wait: 0, offset: time }, params))
  }
  this.waitForMovement = function (startTime) {
    return new Promise((resolve, reject) => {
      let time = 500
      if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
        time = 10
      }
      let timer = setInterval(async () => {
        let now = await this.getTimeline()
        if (now.time !== startTime) {
          resolve()
          clearInterval(timer)
        }
      }, time)
    })
  }
  this.skipAhead = function (current, duration) {
    return new Promise(async (resolve, reject) => {
      console.log('Seeking via the skip-ahead method')
      let startedAt = new Date().getTime()
      let now = this.lastTimelineObject.time
      await this.seekTo(current + duration)
      await this.waitForMovement(now)
      // The client is now ready
      await this.pressPause()
      // Calculate how long it took to get to our ready state
      let elapsed = Math.abs(startedAt - new Date().getTime())
      console.log('Took', elapsed + 'ms for our client to be ready')
      await wait(duration - elapsed)
      await this.pressPlay()
      resolve()
    })
  }
  this.cleanSeek = function (time, isSoft) {
    if (isSoft) {
      return this.seekTo(time, { softSeek: true })
    }
    return this.seekTo(time)
  }
  this.sync = function (hostTimeline, SYNCFLEXABILITY, SYNCMODE) {
    return new Promise(async (resolve, reject) => {
      if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
        await this.getTimeline()
      }
      let lagTime = Math.abs(hostTimeline.recievedAt - new Date().getTime())
      if (lagTime) {
        console.log('Adding lag time of', lagTime)
        hostTimeline.time += lagTime
      }
      const difference = Math.abs((parseInt(this.lastTimelineObject.time)) - parseInt(hostTimeline.time))
      console.log('Difference', difference)

      let bothPaused = hostTimeline.playerState === 'paused' && this.lastTimelineObject.state === 'paused'

      if (parseInt(difference) > parseInt(SYNCFLEXABILITY) || (bothPaused && difference > 10)) {
      // We need to seek!
        console.log('STORE: we need to seek as we are out by', difference)
        // Decide what seeking method we want to use
        if (SYNCMODE === 'cleanseek' || hostTimeline.playerState === 'paused') {
          return resolve(await this.cleanSeek(hostTimeline.time))
        }
        if (SYNCMODE === 'skipahead') {
          return resolve(await this.skipAhead(hostTimeline.time, 10000))
        }
        // Fall back to skipahead
        return resolve(await this.skipAhead(hostTimeline.time, 10000))
      }
      if (this.clientIdentifier === 'PTPLAYER9PLUS10' && difference > 500) {
        console.log('Soft syncing because difference is', difference)
        return resolve(await this.cleanSeek(hostTimeline.time, true))
      } else {
        resolve('No sync needed')
      }
    })
  }
  this.playMedia = async function (data) {
    // Play a media item given a mediaId key and a server to play from
    // We need the following variables to build our paramaters:
    // MediaId Key, Offset, server MachineId,
    // Server Ip, Server Port, Server Protocol, Path

    // First we will mirror the item so the user has an idea of what we're about to play
    return new Promise(async (resolve, reject) => {
      // try {
      //   await this.mirrorContent(data.ratingKey, data.server)
      // } catch (e) {
      //   console.log('Error mirroring item to client before playing', e)
      //   return reject(e)
      // }
      console.log('Autoplaying from client', data)
      // if (this.clientIdentifier !== 'PTPLAYER9PLUS10') {
      //   await this.mirrorContent(data.ratingKey, data.server)
      // }
      let command = '/player/playback/playMedia'
      let mediaId = '/library/metadata/' + data.ratingKey
      let offset = Math.round(data.offset) || 0
      let serverId = data.server.clientIdentifier
      let address = data.server.chosenConnection.address
      let port = data.server.chosenConnection.port
      let protocol = data.server.chosenConnection.protocol
      let path = data.server.chosenConnection.uri + mediaId

      let params = {
        'X-Plex-Client-Identifier': 'SyncLounge',
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

      if (data.mediaIndex !== undefined || data.mediaIndex !== null) {
        params.mediaIndex = data.mediaIndex
      }

      // Now that we've built our params, it's time to hit the client api
      console.log('Sending command')
      await this.hitApi(command, params, this.chosenConnection)
      console.log('PlayMedia DONE')
      resolve(true)
    })
  }
  this.mirrorContent = function (key, serverObject, callback) {
    // Mirror a media item given a mediaId key and a server to play from
    // We need the following variables to build our paramaters:
    // MediaId Key, Offset (0 for simplicity), server MachineId,
    // Server Ip, Server Port, Server Protocol, Path

    let command = '/player/mirror/details'
    let mediaId = '/library/metadata/' + key
    let serverId = serverObject.clientIdentifier
    let address = serverObject.chosenConnection.address
    let port = serverObject.chosenConnection.port
    let protocol = serverObject.chosenConnection.protocol
    let path = serverObject.chosenConnection.uri + mediaId

    let params = {
      'X-Plex-Client-Identifier': 'SyncLounge',
      'key': mediaId,
      'machineIdentifier': serverId,
      'address': address,
      'port': port,
      'protocol': protocol,
      'path': path,
      'wait': 0,
      'token': serverObject.accessToken
    }
    // Now that we've built our params, it's time to hit the client api
    return this.hitApi(command, params, this.chosenConnection)
  }
  this.subscribe = function (connection, commit) {
    return new Promise((resolve, reject) => {
      const doRequest = () => {
        // Already have a valid http server running, lets send the request
        if (!connection) {
          // It is possible to try to subscribe before we've found a working connection
          connection = this.chosenConnection
        }
        var command = '/player/timeline/subscribe'

        // Now that we've built our params, it's time to hit the client api
        if (connection.uri.charAt(connection.uri.length - 1) === '/') {
          // Remove a trailing / that some clients broadcast
          connection.uri = connection.uri.slice(0, connection.uri.length - 1)
        }

        var _url = connection.uri + command
        // console.log('subscription url: ' + _url)
        this.commandId = this.commandId + 1
        var params = {
          'port': '8555',
          'protocol': 'http',
          'X-Plex-Device-Name': 'SyncLounge',
          commandID: this.commandId
        }
        this.setValue('commandId', this.commandId + 1)
        var options = PlexAuth.getClientApiOptions(_url, this.clientIdentifier, this.uuid, 5000)
        axios.get(connection.uri + command, {
          params,
          headers: options.headers
        }).then((res) => {
          console.log('Subscription result', res)
          this.setValue('lastSubscribe', new Date().getTime())
          resolve()
        }).catch((e) => {
          console.log('Error sending subscribe', e)
          reject(e)
        })
        // axios(options, (error, response, body) => {
        //   // console.log('subscription result', response)
        //   this.setValue('lastSubscribe', new Date().getTime())
        //   if (error) {
        //     return reject(error)
        //   } else {
        //     return resolve(true)
        //   }
        // })
      }
      doRequest()
    })
  }
  this.playContentAutomatically = function (client, hostData, servers, offset) {
    // Automatically play content on the client searching all servers based on the title
    return new Promise(async (resolve, reject) => {
      // First lets find all of our playable items
      let playables = []
      console.log('Autoplay', client, hostData, servers, offset)
      let serversArr = []
      for (let i in servers) {
        serversArr.push(servers[i])
      }
      await Promise.all(serversArr.map(async (server) => {
        return new Promise(async (resolve, reject) => {
          if (!server.chosenConnection) {
            return resolve()
          }
          let results = await server.search(hostData.rawTitle)
          console.log(server.name, 'found', results.length, 'results')
          for (var k = 0; k < results.length; k++) {
            // Now we need to check the result
            if (checkResult(results[k], hostData)) {
              // Its a match!
              playables.push({
                'server': server,
                'result': results[k]
              })
            }
          }
          resolve()
        })
      }))
      playables = playables.sort((a, b) => {
        return parseInt(b.server.publicAddressMatches) - parseInt(a.server.publicAddressMatches)
      })
      console.log('Playables', playables)
      const start = async (index) => {
        // Now lets try and play our items one by one
        console.log('Auto playing index', index, 'of total', playables.length)
        if (playables.length === 0 || index === playables.length) {
          return reject(new Error('Didnt find any playable items'))
        }
        var server = playables[index].server
        var ratingKey = playables[index].result.ratingKey
        let data = {
          ratingKey: ratingKey,
          mediaIndex: null,
          server: server,
          offset: offset || 0
        }
        if (client.clientIdentifier !== 'PTPLAYER9PLUS10') {
          await client.subscribe()
        }
        console.log('Attempting to automatically play', data)
        let res = await this.playMedia(data).catch(() => {
          start(parseInt(parseInt(index) + 1))
        })
        if (!res) {
          return
        }
        console.log('Autoplayer await result', res)
        return resolve()
      }
      start(0)

      function checkResult (data, hostData) {
        console.log('Checking compatibility for this item', data, hostData)
        // Do a series of checks to see if this result is OK
        // Check if rawTitle matches
        if (data.title !== hostData.rawTitle) {
          return false
        }
        // Check if length is close enough
        if (Math.abs(parseInt(data.duration) - parseInt(hostData.maxTime)) > 1000 || !data.duration) {
          return false
        }
        if (data.type === 'movie') {
          // We're good!
          console.log('FOUND A PLAYABLE MOVIE')
          return true
        }
        if (data.type === 'episode') {
          // Check if the show name is the same
          let similarity = stringSimilarity.compareTwoStrings(data.grandparentTitle, hostData.showName)
          console.log('Comparing similarity of', data.grandparentTitle, hostData.showName, similarity)
          return similarity > 0.40
        }
        if (data.type === 'track') {
          // We're good!
          console.log('FOUND A PLAYABLE track')
          return true
        }
        return false
      }
    })
  }
  const wait = (ms) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(ms)
      }, ms)
    })
  }
}
