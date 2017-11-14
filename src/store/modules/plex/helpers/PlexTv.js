var request = require('request')
var safeParse = require('safe-json-parse/callback')
var parseXMLString = require('xml2js').parseString
var http = require('http')

var PlexServer = require('./PlexServer.js')
var PlexClient = require('./PlexClient.js')
var PlexConnection = require('./PlexConnection.js')
var _PlexAuth = require('./PlexAuth.js')
var PlexAuth = new _PlexAuth()

module.exports = function () {

  this.signedin = false
  this.plextvdata = {}
  this.gotDevices = false

  this.user = {}
  this.username = null
  this.all_devices = []
  this.servers = []
  this.clients = []
  this.checkedClients = []

  this.chosenClient = null
  this.chosenServer = null

  this.httpServer = null
  this.httpServerPort = 1

  //Functions
  this.getPort = function () {
    this.httpServerPort = 8082
  }
  this.loginUserPass = function (_username, _password, callback) {
    var that = this
    this.doStandardLogin(_username, _password, function (result) {
      if (result == 200 || result == 201) {
        //Login successful!
        that.signedin = true
        return (callback(true))
      }
      return (callback(false))
    })
  }
  this.loginToken = function (token, callback) {
    var that = this
    this.doTokenLogin(token, function (result) {
      if (result == 200 || result == 201) {
        //Login successful!
        that.signedin = true
        return (callback(true))
      }
      return (callback(false))
    })
  }

  this.getDevices = function (callback) {
    //Retrieve all clients from the plex.tv/api/resources endpoint
    
    return new Promise((resolve, reject) => {
      if (this.user == null) {
        console.log('Must be logged in to retrieve devices!')
        return (callback(false))
      }
      this.gotDevices = false
      this.servers = []
      this.clients = []
      console.log('Retrieving devices for ' + this.user.username)
      var options = PlexAuth.getApiOptions('https://plex.tv/api/resources?includeHttps=1', this.user.authToken, 5000, 'GET')
      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          //Valid response
          parseXMLString(body, async (err, result) => {
            this.servers = []
            this.clients = []
            for (var index in result.MediaContainer.Device) {
              //Handle the individual device
              let device = result.MediaContainer.Device[index]['$']
              //Each device can have multiple network connections
              //Any of them can be viable routes to interacting with the device
              let connections = result.MediaContainer.Device[index]['Connection']
              let tempConnectionsArray = []
              //Create a temporary array of object:PlexConnection
              for (var i in connections) {
                let connection = connections[i]['$']
                //Exclude local IPs starting with 169.254
                if (!connection.address.startsWith('169.254')) {
                  let tempConnection = new PlexConnection()
                  for (var key in connection) {
                    tempConnection[key] = connection[key]
                  }
                  tempConnectionsArray.push(tempConnection)
                }
              }
              this.all_devices.push(device)
              if (device.provides.indexOf('player') != -1) {
                //This is a Client
                //Create a new PlexClient object
                var tempClient = new PlexClient()
                for (var key in device) {
                  tempClient[key] = device[key]
                }
                tempClient.plexConnections = tempConnectionsArray
                tempClient.subscribePort = this.httpServerPort
                tempClient.userData = this.user
                this.clients.push(tempClient)
              } else {
                //This is a Server
                //Create a new PlexServer object
                let tempServer = new PlexServer()
                for (var key in device) {
                  tempServer[key] = device[key]
                }
                tempServer.plexConnections = tempConnectionsArray
                if (tempServer['accessToken'] == null) {
                  tempServer['accessToken'] = this.user.authToken
                }
                //that.servers.push(tempServer)
                tempServer.findConnection().then((result) => {
                  if (result) {
                    this.servers.push(tempServer)
                  }
                })
              }
            }
            let ptplayer = new PlexClient()
            ptplayer.provides = 'player'
            ptplayer.clientIdentifier = 'PTPLAYER9PLUS10'
            ptplayer.platform = 'Web'
            ptplayer.device = 'Web'
            ptplayer.product = 'PlexTogether'
            ptplayer.name = 'PlexTogether Player (BETA)'
            ptplayer.lastSeenAt = Math.round((new Date).getTime() / 1000)
  
            this.clients.push(ptplayer)
            this.clients.sort(function (a, b) {
              return parseInt(b.lastSeenAt) - parseInt(a.lastSeenAt)
            })
  
            // Setup our PTPlayer  
            console.log('Succesfully retrieved all Plex Devices')
            this.gotDevices = true
            return resolve(true)
          })
        } else {
          //Invalid response
          this.gotDevices = true
          return reject(false)
        }
      })
    })    
  }
  this.doTokenLogin = function (token, callback) {
    var that = this
    //Login via a token, this is the normal login path after
    // the initial setup
    var options = PlexAuth.getApiOptions('https://plex.tv/users/sign_in.json', token, 5000, 'POST')
    var that = this
    request(options, function (error, response, body) {
      if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
        safeParse(body, function (err, json) {
          if (err) {
            that.signedin = false
            return (callback(false, response, body))
          }
          that.signedin = true
          that.user = json.user
          return (callback(true, response, body))
        })
      } else {
        var code = response.statusCode
        if (code == 401) {
          that.signedin = false
          return (callback(false, response, body))
        }
        that.signedin = false
        return (callback(false, response, body))
      }
    })

  }
  this.doStandardLogin = function (username, password, _callback) {
    //Sign in to Plex.tv via plex.tv/users/sign_in.json via POST
    var base64encoded = new Buffer(username + ':' + password).toString('base64')
    var options = {
      url: 'https://plex.tv/users/sign_in.json',
      headers: {
        'Authorization': 'Basic ' + base64encoded,
        'X-Plex-Client-Identifier': global.constants.X_PLEX_CLIENT_IDENTIFIER
      },
      method: 'POST'
    }
    var that = this
    request(options, function (error, response, body) {
      if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
        safeParse(body, function (err, json) {
          that.user = json.user
          that.signedin = true
          return (_callback(response.statusCode))
        })
      } else {
        var code = response.statusCode
        if (code == 401) {
          that.signedin = false
          return (_callback(response.statusCode))
        }
        that.signedin = false
        return (_callback(response.statusCode))
      }
    })
  }
  this.getClientById = function (clientId, callback) {
    for (var i in this.clients) {
      var client = this.clients[i]
      if (client.clientIdentifier == clientId) {
        return callback(client)
      }
    }
    return callback(null)
  }
  this.getServerById = function (clientId) {
    for (var i in this.servers) {
      var server = this.servers[i]
      if (server.clientIdentifier == clientId) {
        return server
      }
    }
    return null
  }
  this.getRandomThumb = function (callback) {
    let ticker = (failures) => {
      setTimeout( () => {      
        if (failures == 10){
          return callback(false)
        }
        let validServers = this.servers.filter( (server) => {
          if (server.chosenConnection){
            return true
          }
          return false
        })
        if (validServers.length > 1){
          let randomServer = validServers[Math.floor(Math.random()*validServers.length)]
          randomServer.getRandomItem((result) => {
            console.log('Random item result',result)
            if (!result){
              return callback(false)
            }
            return callback(randomServer.getUrlForLibraryLoc(result.thumb,900 ,900 ,8))
          })
        } else {
          ticker(failures+1)
        }
      },100)
    }
    ticker(0)   
    
  }
  this.playContentAutomatically = function (client, hostData, blockedServers, offset, callback) {
    // Automatically play content on the client searching all servers based on the title
    var that = this

    // First lets find all of our playable items
    let playables = []
    let j = 0

    let validServers = this.servers.length
    if (blockedServers){
      for (let i = 0; i < blockedServers.length; i++ ){
        if (this.getServerById(blockedServers[i])){
          validServers--
        }
      }
    }
    if (validServers == 0){
      return callback(false)
    }
    for (let i = 0; i < this.servers.length; i++) {
      var server = this.servers[i]
      let blocked = false
      if (blockedServers){
        for (let i = 0; i < blockedServers.length; i++ ){
          if (blockedServers[i] == server.clientIdentifier){
            console.log('Server: ' + server.name + ' is blocked - not searching')
            blocked = true
          }
        }
      }
      if (blocked){
        continue
      }
      server.search(hostData.rawTitle, function (results, _server) {
        j++
        console.log('Heard back from ' + j + ' servers')
        if (results != null) {
          for (var k = 0; k < results.length; k++) {
            //Now we need to check the result
            if (checkResult(results[k], hostData)) {
              //Its a match!
              playables.push({
                'server': _server,
                'result': results[k]
              })

            }
          }
        }

        if (j == validServers) {
          console.log('Found ' + playables.length + ' playable items')
          start(playables, 0)
        }
      })
    }

    function start (playables, index) {
      // Now lets try and play our items one by one
      if (playables.length == 0) {
        console.log('We didnt find any playables.')
        return callback(false)
      }
      console.log('Going to try playing the next playable: Index ' + index)
      var server = playables[index].server
      console.log('Attempting to play from ')
      console.log(server)
      var ratingKey = playables[index].result.ratingKey
      let data = {          
        ratingKey: ratingKey,
        mediaIndex: null,
        server: server,
        offset: offset || 0,
        callback: function(playResult, code){
          console.log('Play result: ' + code)
          if (code == 200) {
            return callback(true)
          } else {

            return start(playables, parseInt(parseInt(index) + 1))
          }
        }
      }
      if (client.clientIdentifier == 'PTPLAYER9PLUS10') {        
        client.playMedia(data)
      } else {
        // Standard Plex Player
        client.subscribe(function (result) {          
          client.playMedia(data)
        })

      }

    }

    function checkResult (data, hostData) {
      console.log('Checking compatibility for this item')
      console.log(data)
      console.log(hostData)
      //Do a series of checks to see if this result is OK
      //Check if rawTitle matches
      if (data.title != hostData.rawTitle) {
        //global.renderLog.info('wrong title')
        return false
      }
      //Check if length is close enough
      if (Math.abs(parseInt(data.duration) - parseInt(hostData.maxTime)) > 5000 || !data.duration) {
        //global.renderLog.info('wrong time')
        return false
      }
      if (data.type == 'movie') {
        //We're good!
        console.log('FOUND A PLAYABLE MOVIE')
        return true
      }
      if (data.type == 'episode') {
        //Check if the show name is the same
        console.log('FOUND A PLAYABLE TV EPISODE')
        return true

      }      
      if (data.type == 'track') {
        //We're good!
        console.log('FOUND A PLAYABLE track')
        return true
      }
      return false
    }
  },

    this.createHttpServer = function () {

    }
  this.getPort()
}
