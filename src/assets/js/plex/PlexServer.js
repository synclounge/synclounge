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

  //Functions
  this.hitApi = function (command, params, callback) {
    var that = this
    var query = ''
    //console.log('Query params: ' + JSON.stringify(params))
    for (let key in params) {
      query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
    }
    if (!this.chosenConnection) {
      return callback(null, this, null)
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
            return callback(null, that)
          }
          return callback(json, that, response.elapsedTime)
        })
      } else {
        return callback(null, that)
      }
    })
  }
  this.hitApiTestConnections = function (command, connection, callback) {
    //For use with #findConnection
    if (connection == null) {
      if (this.chosenConnection == null) {
        console.log('You need to specify a connection!')
        return (callback(false, connection))
      }
    }
    var _url = connection.uri + command
    var options = PlexAuth.getApiOptions(_url, this.accessToken, 7500, 'GET')
    request(options, function (error, response, body) {
      if (!error) {
        safeParse(body, function (err, json) {
          if (err) {
            return callback(null, connection)
          }
          return callback(json, connection, response.elapsedTime)
        })
      } else {
        return callback(null, connection)
      }
    })
  }
  this.setChosenConnection = function (con) {
    //console.log('Setting the used connection for ' + this.name + ' to ' + con.uri)
    this.chosenConnection = con
    return
  }
  this.findConnection = function (callback) {
    //This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.
    var that = this
    var j = 0
    var returned = false
    for (var i in this.plexConnections) {
      var connection = this.plexConnections[i]
      this.hitApiTestConnections('', connection, function (result, connectionUsed, responseTime) {
        j++
        //console.log('Connection attempt result below for ' + that.name)
        //console.log(connectionUsed)
        if (result == null || result == undefined) {
          //console.log('Connection failed: ' + connectionUsed.uri)
          //console.log(result)
        } else {
          if (that.chosenConnection != null) {
            //Looks like we've already found a good connection
            // lets disregard this connection
            //console.log('Already have a working connection for ' + that.name + ' which is ' + that.chosenConnection.uri)
          }
          if ((result.MediaContainer != undefined || result._elementType != undefined) && that.chosenConnection == null) {
            //console.log('Found the first working connection for ' + that.name + ' which is ' + connectionUsed.uri)
            connectionUsed.responseTime = responseTime
            that.setChosenConnection(connectionUsed)
            returned = true
            return callback(true, that)
          }

          if (j == that.plexConnections.length && !returned) {
            return callback(that.chosenConnection ? true : false, that)
          }
        }
      })
    }
  }

  //Functions for dealing with media
  this.search = function (searchTerm, callback) {
    //This function hits the PMS using the /search endpoint and returns what the server returns if valid
    var that = this
    //console.log('Searching ' + this.name + ' for ' + searchTerm)
    this.hitApi('/search', {query: searchTerm}, function (result) {
      let validResults = []
      console.log(this.name,result)
      if (result && result.MediaContainer) {
        if (result.MediaContainer.Metadata) {
          for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
            validResults.push(result.MediaContainer.Metadata[i])
          }
          console.log(that.name + ' found ' + validResults.length + ' results')
        }
        return callback(validResults, that)
      }
      return callback(null, that)
    })
  }

  this.getMediaByRatingKey = function (ratingKey, callback) {
    //This function hits the PMS and returns the item at the ratingKey
    var that = this
    console.log('Getting data for ' + ratingKey)
    this.hitApi('/library/metadata/' + ratingKey, {}, function (result, that) {
      let validResults = []
      console.log('Response back from metadata request')
      return handleMetadata(result, that, callback)
    })
  }
  this.markWatchedByRatingKey = function (ratingKey, callback) {
    console.log('Marking ' + ratingKey + ' as watched')
    this.hitApi('/:/scrobble', {
      identifier: 'com.plexapp.plugins.library',
      key: ratingKey
    }, callback)
  }
  this.getUrlForLibraryLoc = function (location, width, height, blur) {
    if (!(blur > 0)) {
      blur = 0
    }
    return this.chosenConnection.uri + '/photo/:/transcode?url=' + location + '&X-Plex-Token=' + this.accessToken + '&height=' + Math.floor(height) + '&width=' + Math.floor(width) + '&blur=' + blur
  }
  this.getRandomItem = function (callback) {
    console.log('Getting random item')
    this.getAllLibraries((res) => {
      if (!res || !res.MediaContainer || !res.MediaContainer.Directory) {
        return callback(false)
      }
      let libraries = res.MediaContainer.Directory
      let library = libraries[Math.floor(Math.random()*libraries.length)]

      this.getLibraryContents(library.key, 0, 50, (result) => {
        if (!result) {
          return callback(false)
        }
        let items = result.MediaContainer.Metadata
        let item = items[Math.floor(Math.random()*items.length)]
        return callback(item)
      })
    })
  }
  this.getAllLibraries = function (callback) {
    this.hitApi('/library/sections', {}, function (result, that) {
      callback(result)
    })
  }
  this.getLibraryContents = function (key, start, size, callback) {
    this.hitApi('/library/sections/' + key + '/all', {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size
    }, function (result, that) {
      callback(result)
    })
  }
  this.getRecentlyAddedAll = function (start, size, callback) {
    this.hitApi('/library/recentlyAdded', {}, function (result, that) {
      return callback(result)
    })
  }
  this.getOnDeck = function (start, size, callback) {
    this.hitApi('/library/onDeck', {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size,
    }, function (result, that) {
      return callback(result)
    })
  }
  this.getRelated = function (ratingKey, size, callback) {
    ratingKey = ratingKey.replace('/library/metadata/','')
    this.hitApi('/hubs/metadata/'+ratingKey+'/related', {
      excludeFields: 'summary',
      count: 12
    }, function (result, that) {
      return callback(result)
    })
  }
  this.getSeriesData = function (key, callback) {
    this.hitApi(key, {
      includeConcerts:1,
      includeExtras:1,
      includeOnDeck:1,
      includePopularLeaves:1,
      asyncCheckFiles:1,
      asyncRefreshAnalysis:1,
      asyncRefreshLocalMediaAgent:1
    }, function (result, that) {
      callback(result)
    })
  }
  
  this.getSeriesChildren = function (key, start, size, excludeAllLeaves, callback) {
    this.hitApi(key, {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size,
      excludeAllLeaves: excludeAllLeaves
    }, function (result, that) {
      callback(result)
    })
  }

  function handleMetadata (result, that, callback) {
    if (result != null) {
      if (result._children) {
        // Old Server version compatibility
        for (var i in result._children) {
          var res = result._children[i]
          if (res._elementType == 'Directory' || res._elementType == 'Media' || res._elementType == 'Video') {
            res.machineIdentifier = that.clientIdentifier
            return callback(res, that)
          }
        }
      } else {
        // New Server compatibility
        result.MediaContainer.Metadata[0].machineIdentifier = that.clientIdentifier
        return callback(result.MediaContainer.Metadata[0], that)
      }

      console.log('Didnt find a compatible PMS Metadata object. Result from the server is below')
      console.log(result)
      return callback(null, that)
    }
  }
}
