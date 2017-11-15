var request = require('request')
var safeParse = require('safe-json-parse/callback')
var parseXMLString = require('xml2js').parseString
var PlexTv = require('./PlexTv.js')
var PlexClient = require('./PlexClient.js')
var PlexConnection = require('./PlexConnection.js')
var _PlexAuth = require('./PlexAuth.js')
var PlexAuth = new _PlexAuth()

module.exports = function PlexServer () {
  this.name
  this.product
  this.productVersion
  this.platform
  this.platformVersion
  this.device
  this.clientIdentifier
  this.createdAt
  this.lastSeenAt
  this.provides
  this.owned
  this.httpsRequired
  this.ownerId
  this.home
  this.accessToken
  this.sourceTitle
  this.synced
  this.relay
  this.publicAddressMatches
  this.presence
  this.plexConnections
  this.chosenConnection = null

  this.commit

  this.setValue = function (key, value) {
    console.log('Server setting ', key, 'to', value, this)
    this[key] = value
    this.commit('PLEX_SERVER_SET_VALUE', [this, key, value])
  }

  //Functions
  this.hitApi = function (command, params) {
    return new Promise(async (resolve, reject) => {
      var query = ''
      //console.log('Query params: ' + JSON.stringify(params))
      for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
      }
      if (!this.chosenConnection) {
        let result = await this.findConnection()
        if (!result) {
          reject('Failed to find a connection')
        }
      }
      console.log('Hitting server ' + this.name + ' via ' + this.chosenConnection.uri)
      var _url = this.chosenConnection.uri + command + '?' + query
      var options = PlexAuth.getApiOptions(_url, this.accessToken, 15000, 'GET')
      //console.log('Hitting server ' + this.name + ' with command ' + command)
      //console.log(options)
      request(options, function (error, response, body) {
        if (!error) {
          safeParse(body, function (err, json) {
            if (err) {
              return reject(false)
            }
            return resolve(json)
          })
        } else {
          return reject(false)
        }
      })
    })    
  }
  this.hitApiTestConnection = async function (command, connection) {
    //For use with #findConnection

    return new Promise(async (resolve, reject) => {
      var _url = connection.uri + command
      var options = PlexAuth.getApiOptions(_url, this.accessToken, 7500, 'GET')
      request(options, function (error, response, body) {
        if (!error) {
          safeParse(body, function (err, json) {
            if (err) {
              return reject(err)
            }
            return resolve(json)
            //return callback(json, connection, response.elapsedTime)
          })
        } else {
          return reject(null)
        }
      })
    })   
  }
  this.setChosenConnection = function (con) {
    //console.log('Setting the used connection for ' + this.name + ' to ' + con.uri)
    this.chosenConnection = con
    return
  }
  this.findConnection = function () {
    //This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.
    let resolved = false

    return new Promise(async (resolve, reject) => {
      await Promise.all(this.plexConnections.map(async (connection, index) => {
        return new Promise(async (_resolve, _reject) => {
            try {
                let result = await this.hitApiTestConnection('', connection)
                if (result) {
                    resolved = true
                    //console.log('Succesfully connected to', server, 'via', connection)
                    this.setValue('chosenConnection', connection)
                    resolve(true)
                }
                _resolve(false)
            } catch (e) {
              _resolve(false)
            }
        })
    }))
    if (!resolved) {
        reject('Unable to find a connection')
    }
  })









    // var that = this
    // var j = 0
    // var returned = false
    // for (var i in this.plexConnections) {
    //   var connection = this.plexConnections[i]
    //   this.hitApiTestConnections('', connection, function (result, connectionUsed, responseTime) {
    //     j++
    //     //console.log('Connection attempt result below for ' + that.name)
    //     //console.log(connectionUsed)
    //     if (result == null || result == undefined) {
    //       //console.log('Connection failed: ' + connectionUsed.uri)
    //       //console.log(result)
    //     } else {
    //       if (that.chosenConnection != null) {
    //         //Looks like we've already found a good connection
    //         // lets disregard this connection
    //         //console.log('Already have a working connection for ' + that.name + ' which is ' + that.chosenConnection.uri)
    //       }
    //       if ((result.MediaContainer != undefined || result._elementType != undefined) && that.chosenConnection == null) {
    //         //console.log('Found the first working connection for ' + that.name + ' which is ' + connectionUsed.uri)
    //         connectionUsed.responseTime = responseTime
    //         that.setChosenConnection(connectionUsed)
    //         returned = true
    //         return callback(true, that)
    //       }

    //       if (j == that.plexConnections.length && !returned) {
    //         return callback(that.chosenConnection ? true : false, that)
    //       }
    //     }
    //   })
    // }
  }

  //Functions for dealing with media
  this.search = async function (searchTerm) {
    //This function hits the PMS using the /search endpoint and returns what the server returns if valid
    let result = await this.hitApi('/search', { query: searchTerm })
    let validResults = []
    if (result && result.MediaContainer) {
      if (result.MediaContainer.Metadata) {
        for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
          validResults.push(result.MediaContainer.Metadata[i])
        }
      }
      return validResults
    }
    return null
  }

  this.getMediaByRatingKey = async function (ratingKey) {
    //This function hits the PMS and returns the item at the ratingKey
    let data = await this.hitApi('/library/metadata/' + ratingKey, {})
    return this.handleMetadata(data)
  }
  this.markWatchedByRatingKey = function (ratingKey) {
    return this.hitApi('/:/scrobble', {
      identifier: 'com.plexapp.plugins.library',
      key: ratingKey
    })
  }
  this.getUrlForLibraryLoc = function (location, width, height, blur) {
    if (!(blur > 0)) {
      blur = 0
    }
    return this.chosenConnection.uri + '/photo/:/transcode?url=' + location + '&X-Plex-Token=' + this.accessToken + '&height=' + Math.floor(height) + '&width=' + Math.floor(width) + '&blur=' + blur
  }
  this.getRandomItem = async function () {
    try {
      let data = await this.getAllLibraries() 
      if (!data || !data.MediaContainer || !data.MediaContainer.Directory) {
        return false
      }
      let libraries = data.MediaContainer.Directory
      let library = libraries[Math.floor(Math.random() * libraries.length)]

      let result = await this.getLibraryContents(library.key, 0, 50)
      if (!result) {
        return false
      }
      let items = result.MediaContainer.Metadata
      let item = items[Math.floor(Math.random()*items.length)]
      return item
      
    } catch (e) {
      console.log(e) 
      throw new Error(e)
    }
    

    this.getAllLibraries((res) => {
     
    })
  }
  this.getAllLibraries = function () {
    return this.hitApi('/library/sections', {})
  }
  this.getLibraryContents = function (key, start, size) {
    return this.hitApi('/library/sections/' + key + '/all', {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size
    })
  }
  this.getRecentlyAddedAll = function (start, size, callback) {
    return this.hitApi('/library/recentlyAdded', {})
  }
  this.getOnDeck = function (start, size, callback) {
    return this.hitApi('/library/onDeck', {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size,
    })
  }
  this.getRelated = function (ratingKey, size, callback) {
    ratingKey = ratingKey.replace('/library/metadata/','')
    return this.hitApi('/hubs/metadata/'+ratingKey+'/related', {
      excludeFields: 'summary',
      count: 12
    })
  }
  this.getSeriesData = function (key, callback) {
    return this.hitApi(key, {
      includeConcerts: 1,
      includeExtras: 1,
      includeOnDeck: 1,
      includePopularLeaves: 1,
      asyncCheckFiles: 1,
      asyncRefreshAnalysis: 1,
      asyncRefreshLocalMediaAgent: 1
    })
  }
  
  this.getSeriesChildren = function (key, start, size, excludeAllLeaves, callback) {
    return this.hitApi(key, {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size,
      excludeAllLeaves: excludeAllLeaves
    })
  }

  this.handleMetadata = function (result) {
    if (result != null) {
      if (result._children) {
        // Old Server version compatibility
        for (var i in result._children) {
          var res = result._children[i]
          if (res._elementType == 'Directory' || res._elementType == 'Media' || res._elementType == 'Video') {
            res.machineIdentifier = this.clientIdentifier
            return res
          }
        }
      } else {
        // New Server compatibility
        result.MediaContainer.Metadata[0].machineIdentifier = this.clientIdentifier
        return result.MediaContainer.Metadata[0]
      }

      console.log('Didnt find a compatible PMS Metadata object. Result from the server is below')
      console.log(result)
      return null
    }
  }
}
