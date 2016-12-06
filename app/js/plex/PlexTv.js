var request = require('request');
var safeParse = require("safe-json-parse/callback")
var parseXMLString = require('xml2js').parseString;

var PlexServer = require('./PlexServer.js')
var PlexClient = require('./PlexClient.js')
var PlexConnection = require('./PlexConnection.js')


module.exports = function(){
        
    this.user;
    this.username = null;
    this.password = null;
    this.all_devices = [];
    this.servers = [];
    this.clients = [];

    this.chosenClient = null;
    this.chosenServer = null;
    
    //Functions 
    this.loginUserPass = function(_username,_password,callback){
        var that = this
        this.doStandardLogin(_username,_password,function(result){
            if (result == 200 || result == 201){
                //Login successful!
                return(callback(true))
            }
            return(callback(false))
        })
    }
    this.loginToken = function(token,callback){
        var that = this
        this.doTokenLogin(token,function(result){
            if (result == 200 || result == 201){
                //Login successful!
                return(callback(true))
            }
            return(callback(false))
        })
    }
       
    this.getDevices = function(callback){
        //Retrieve all clients from the plex.tv/api/resources endpoint
        var that = this;
        if (this.user == null){
            global.log.info("Must be logged in to retrieve devices!")
            return(callback(false))
        }
        global.log.info("Retrieving devices for " + this.user.username)
        var options = {
            url: 'https://plex.tv/api/resources?includeHttps=1',
            headers: {
                'X-Plex-Token': this.user.authToken
            }
        }
        request(options,function(error,response,body){
            if (!error && response.statusCode == 200){ 
                //Valid response 
                parseXMLString(body, function(err,result){
                    that.servers = []
                    that.clients = []                    
                    for (var index in result.MediaContainer.Device){
                        //Handle the individual device
                        device = result.MediaContainer.Device[index]["$"]
                        //Each device can have multiple network connections
                        //Any of them can be viable routes to interacting with the device
                        connections = result.MediaContainer.Device[index]["Connection"]
                        tempConnectionsArray = []
                        //Create a temporary array of object:PlexConnection
                        for (var i in connections){
                            connection = connections[i]["$"]
                            //Exclude local IPs starting with 169.254
                            if(!connection.address.startsWith("169.254")){
                                tempConnection = new PlexConnection()
                                for (var key in connection){
                                    tempConnection[key] = connection[key]
                                }
                                tempConnectionsArray.push(tempConnection)
                            }
                        }
                        that.all_devices.push(device)
                        if (device.provides.indexOf("player")!= -1){
                            //This is a Client
                            //Create a new PlexClient object
                            var tempClient = new PlexClient();
                            for (var key in device){
                                tempClient[key] = device[key]
                            }
                            tempClient.plexConnections = tempConnectionsArray
                            that.clients.push(tempClient)
                        } else {
                            //This is a Server
                            //Create a new PlexServer object
                            var tempServer = new PlexServer();
                            for (var key in device){
                                tempServer[key] = device[key]
                            }
                            tempServer.plexConnections = tempConnectionsArray
                            if (tempServer["accessToken"] == null){
                                tempServer["accessToken"] = that.user.authToken
                            }
                            that.servers.push(tempServer)
                        }
                    }
                    global.log.info('Succesfully retrieved all Plex Devices')
                    global.log.info('Found ' + that.clients.length + ' clients and ' + that.servers.length + ' servers!')                    
                    return(callback(true))
                })
            } else {
                //Invalid response
                return(callback(false))
            }
        })
    };
    this.doTokenLogin = function(token,callback){
        var that = this
        //Login via a token, this is the normal login path after
        // the initial setup
        global.log.info('Signing in to Plex.tv via token')
        var options = {
            url: 'https://plex.tv/users/sign_in.json',
            headers: {
                'X-Plex-Token': token,
                'X-Plex-Client-Identifier': 'PlexTogether'
            },
            method:'POST'
        }
        var that = this;
        request(options, function (error, response, body) {
            if (!error && (response.statusCode == 200 || response.statusCode == 201)) {                
                safeParse(body, function (err, json) {
                    that.user = json.user
                    global.log.info('Succesfully signed in.')
                    return(callback(response.statusCode))
                })
            } else {
                var code = response.statusCode
                if (code == 401){
                    global.log.info('Invalid token! You should get a new token now! (Response code 401)')
                    return(callback(response.statusCode))
                }
                global.log.info('Login unsuccessful! (Response code ' + code + ')')
                return(callback(response.statusCode))
            }
        })

    }
    this.doStandardLogin = function(username,password,_callback){
        //Sign in to Plex.tv via plex.tv/users/sign_in.json via POST
        global.log.info('Signing in to Plex.tv as ' + this.username)
        var base64encoded = new Buffer(username + ":" + password).toString('base64')
        var options = {
            url: 'https://plex.tv/users/sign_in.json',
            headers: {
                'Authorization': 'Basic ' + base64encoded,
                'X-Plex-Client-Identifier': 'PlexTogether'
            },
            method:'POST'
        }
        var that = this;
        request(options, function (error, response, body) {
            if (!error && (response.statusCode == 200 || response.statusCode == 201)) {                
                safeParse(body, function (err, json) {
                    that.user = json.user
                    global.log.info('Succesfully signed in.')
                    return(_callback(response.statusCode))
                })
            } else {
                var code = response.statusCode
                if (code == 401){
                    global.log.info('Invalid login details! (Response code 401)')
                    return(_callback(response.statusCode))
                }
                global.log.info('Login unsuccessful! (Response code ' + code + ')')
                return(_callback(response.statusCode))
            }
        })
    };
    this.getClientById = function(clientId,callback){
        for (var i in this.clients){
            var client = this.clients[i]
            if (client.clientIdentifier == clientId){
                return callback(client)
            }
        }
        return callback(null)
    }    
    this.getServerById = function(clientId,callback){
        for (var i in this.servers){
            var server = this.servers[i]
            if (server.clientIdentifier == clientId){
                return callback(server)
            }
        }
        return callback(null)
    }

    
}
