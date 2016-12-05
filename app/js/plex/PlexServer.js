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
    this.chosenConnection;

    //Functions
    this.hitApi = function(command,params,connection,callback){
        var that = this
        console.log('Hitting server ' + this.name + ' via ' + connection.uri)
            if (connection == null){
                if (this.chosenConnection == null){
                    console.log('SERVER: You should find a working connection via #findConnection first!')
                }
            }
            var query = "";
            for (key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            var _url = connection.uri + command + '?' + query
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
            var that = this;
            //console.log('Hitting server ' + this.name + ' with command ' + command)
            //console.log(options)
            request(options, function (error, response, body) {
                /*
                console.log('Raw response back from the PMS Server ' + that.name + ' is below')
                console.log('Body VVV')
                console.log(body)
                console.log('Error VVV')
                console.log(error)
                */
                if (!error) {
                    safeParse(body, function (err, json){
                        if (err){
                            return callback(null,that)
                        }
                        return callback(json,that)                        
                    })
                } else {
                    return callback(null,that)
                }
            }) 
    }
    this.hitApiTestConnections = function(command,connection,callback){
        //For use with #findConnection
        if (connection == null){
            if (this.chosenConnection == null){
                console.log('You need to specify a connection!')
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
            timeout: 5000
        }
        var that = this;
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
    this.findConnection = function(callback){
        //This function iterates through all available connections and 
        // if any of them return a valid response we'll set that connection
        // as the chosen connection for future use.
        var that = this;
        that.chosenConnection = null;
        for (var i in this.plexConnections){
            var connection = this.plexConnections[i]
            this.hitApi('',{},connection,function(result){
                    console.log('Find connection result below')                    
                    if (result == null || result == undefined) {
                        console.log('A connection failed for ' + that.name)
                        console.log(result)
                        return(callback(false))
                    }
                    if (that.chosenConnection != null){
                        //Looks like we've already found a good connection
                        // lets disregard this connection 
                        console.log('Already have a working connection for ' + that.name)
                        return(callback(true))
                    }
                    if (result.MediaContainer != undefined || result._elementType != undefined){
                        console.log('Found the first working connection for ' + that.name)
                        that.chosenConnection = connection 
                        return(callback(true))                    
                    }                     

                    console.log('Unsure of what this result is for connection to PMS. Probably failed. Server: ' + that.name)
                    console.log(result)
                    return(callback(false))                
                })  
            }                      
    
    }

    //Functions for dealing with media 
    this.search = function(searchTerm,callback){
        //This function hits the PMS using the /search endpoint and returns what the server returns if valid
        var that = this
        this.hitApi('/search',{'query':searchTerm},this.chosenConnection,function(result){
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
        this.hitApi('/library/metadata/'+ratingKey,{},this.chosenConnection,function(result,that){
            validResults = []
            console.log('Response back from metadata request')
            console.log(result)
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
                console.log('Didnt find a compatible PMS Metadata object. Result from the server is below')
                console.log(result)
                return callback(null,that)
            }                 
            console.log('Didnt find a compatible PMS Metadata object because result == null. Result from the server is below')
            console.log(result)
            return callback(null,that)
        })
    }
};