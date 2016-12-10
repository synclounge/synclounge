var request = require('request');
var safeParse = require("safe-json-parse/callback")
var parseXMLString = require('xml2js').parseString;
var PlexTv = require('./PlexTv.js')
var PlexClient = require('./PlexClient.js')
var PlexConnection = require('./PlexConnection.js')
module.exports = function PlexServer(){
    this.name;
    this.product;
    this.productVersion;
    this.platform;
    this.platformVersion;
    this.device;
    this.clientIdentifier;
    this.createdAt;
    this.lastSeenAt;
    this.provides;
    this.owned;
    this.httpsRequired;
    this.ownerId;
    this.home;
    this.accessToken
    this.sourceTitle;
    this.synced;
    this.relay;
    this.publicAddressMatches;
    this.presence;
    this.plexConnections;
    this.chosenConnection = null;

    //Functions
    this.hitApi = function(command,params,callback){
        var that = this
        var query = "";
        for (key in params) {
            query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
        }
        global.log.info('Hitting server ' + this.name + ' via ' + this.chosenConnection.uri)
        var _url = this.chosenConnection.uri + command + '?' + query
        var options = {
            url: _url,
            time: true,
            headers: {
                'X-Plex-Client-Identifier': 'PlexTogether',
                'Accept':'application/json',
                'X-Plex-Token':this.accessToken
            },
            timeout: 15000
        }
        //global.log.info('Hitting server ' + this.name + ' with command ' + command)
        //global.log.info(options)
        request(options, function (error, response, body) {
            if (!error) {
                safeParse(body, function (err, json){
                    if (err){
                        return callback(null,that,connection)
                    }
                    return callback(json,that,connection)                        
                })
            } else {
                return callback(null,that,connection)
            }
        }) 
    }
    this.hitApiTestConnections = function(command,connection,callback){
        //For use with #findConnection
        if (connection == null){
            if (this.chosenConnection == null){
                global.log.info('You need to specify a connection!')
                return(callback(false,connection))
            }
        }
        var _url = connection.uri + command
        var options = {
            url: _url,
            time: true,
            headers: {
                'X-Plex-Client-Identifier': 'PlexTogether',
                'Accept':'application/json',
                'X-Plex-Token':this.accessToken
            },
            timeout: 7500
        }
        request(options, function (error, response, body) {
            if (!error) {
                safeParse(body, function (err, json){
                    if (err){
                        return callback(null,connection)
                    }
                    return callback(json,connection)                        
                })
            } else {
                return callback(null,connection)
            }
        }) 
    }
    this.setChosenConnection = function(con) {
        console.log('Setting the used connection for ' + this.name + ' to ' + con.uri)
        this.chosenConnection = con
        return
    }
    this.findConnection = function(){
        //This function iterates through all available connections and 
        // if any of them return a valid response we'll set that connection
        // as the chosen connection for future use.
        var that = this;
        for (var i in this.plexConnections){
            var connection = this.plexConnections[i]
            this.hitApiTestConnections('',connection,function(result,connectionUsed){
                //global.log.info('Connection attempt result below for ' + that.name)         
                //global.log.info(connectionUsed)           
                if (result == null || result == undefined) {
                    global.log.info('Connection failed: ' + connectionUsed.uri) 
                    //global.log.info(result)
                    return
                }
                if (that.chosenConnection != null){
                    //Looks like we've already found a good connection
                    // lets disregard this connection 
                    global.log.info('Already have a working connection for ' + that.name + ' which is ' + that.chosenConnection.uri)
                    return
                }
                if (result.MediaContainer != undefined || result._elementType != undefined){
                    global.log.info('Found the first working connection for ' + that.name + ' which is ' + connectionUsed.uri)
                    that.setChosenConnection(connectionUsed)
                    return                   
                }                     

                //global.log.info('Unsure of what this result is for connection to PMS. Probably failed. Server: ' + that.name)
                //global.log.info(result)
                return              
            })  
        }  
    }

    //Functions for dealing with media 
    this.search = function(searchTerm,callback){
        //This function hits the PMS using the /search endpoint and returns what the server returns if valid
        var that = this
        this.hitApi('/search',{'query':searchTerm},function(result){
            validResults = []
            if (result){             
                for (var i in result._children){
                    var res = result._children[i]
                    if (res._elementType == 'Directory' || res._elementType == 'Media' || res._elementType == 'Video'){
                        validResults.push(res)
                    }
                }
                return callback(validResults,that)
            }
            return callback(null,that)
        })
    }

    this.getMediaByRatingKey = function(ratingKey,callback){
        //This function hits the PMS and returns the item at the ratingKey
        this.hitApi('/library/metadata/'+ratingKey,{},function(result,that){
            validResults = []
            global.log.info('Response back from metadata request')
            //global.log.info(result)
            if (result != null){                
                if (result._children) {
                    // Old Server version compatibility
                    for (var i in result._children){
                        var res = result._children[i]
                        if (res._elementType == 'Directory' || res._elementType == 'Media' || res._elementType == 'Video'){
                            return callback(res,that)
                        }
                    }
                } else {
                    // New Server compatibility
                    return callback(result.MediaContainer.Metadata[0],that)
                }
                global.log.info('Didnt find a compatible PMS Metadata object. Result from the server is below')
                global.log.info(result)
                return callback(null,that)
            }                 
            global.log.info('Didnt find a compatible PMS Metadata object because result == null. Result from the server is below')
            global.log.info(result)
            return callback(null,that)
        })
    }
};