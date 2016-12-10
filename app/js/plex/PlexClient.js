var request = require('request');
var safeParse = require("safe-json-parse/callback")
var parseXMLString = require('xml2js').parseString;
var http = require('http');
var fs = require('fs');


var PlexServer = require('./PlexServer.js')
var PlexTv = require('./PlexTv.js')
var PlexConnection = require('./PlexConnection.js')
module.exports = function PlexClient(){
    this.commandId = 0;

    this.name = null;
    this.product = null;
    this.productVersion = null;
    this.platform = null;
    this.platformVersion = null;
    this.device = null;
    this.clientIdentifier = null;
    this.createdAt = null;
    this.lastSeenAt = null;
    this.provides = null;
    this.owned = null;
    this.publicAddressMatches = null;
    this.presence = null;
    this.plexConnections = null;
    this.chosenConnection = null;   
    this.httpServer = null;    
    this.tempId = null;

    // Latest objects for reference in the future
    this.lastRatingKey = null;
    this.lastTimelineObject = null;
    this.clientPlayingMetadata = null;
    this.lastSubscribe = 0;

    // Event listening array
    this.events = {};

    // Functions     
    this.generateGuid = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4();
    }  
    this.uuid = this.generateGuid(); 

    this.fire = function(msg) {
        //global.log.info('recieved a fire event for ' + msg)
        let toProc = this.events[msg]
        if (toProc == undefined) {
            return
        }
        for (let i = 0; i < toProc.length; i++ ) {
            //global.log.info('Firing event: ' + msg)
            toProc[i]()
        }
    }
    this.on = function(msg,callback){
        if (this.events[msg] == undefined) {
            this.events[msg] = []
        }
        this.events[msg].push(callback)
    }
    this.updateTimelineObject = function(timelines,responseTime,callback) {
        if (timelines != null){
            // Valid timeline data
            if (responseTime != null) {
                this.lastResponseTime = responseTime
            }
            for (let i in timelines){
                let _timeline = timelines[i]['$']
                if (_timeline.type == 'video'){
                    this.lastTimelineObject = timelines[i]['$']
                    this.lastTimelineObject.recievedAt = new Date().getTime()
                    this.fire('client-update')
                    return callback(_timeline)
                }
            }
        }
        return callback(null)
    }
    this.hitApi = function(command,params,connection,callback){
        var that = this;
        //global.log.info('Time since last subscription command: ' + (new Date().getTime() - this.lastSubscribe))
        if ( (new Date().getTime() - this.lastSubscribe) > 29000 ) {
            // We need to subscribe first!
            this.subscribe(function(result){
                //global.log.info('subscription result: ' + result)
                if (result) {
                    that.lastSubscribe = new Date().getTime()
                }
                doRequest()
            })
        } else {
            doRequest()
        }
        function doRequest(){
            if (connection == null){
                if (this.chosenConnection == null){
                    global.log.info('You should find a working connection via #findConnection first!')
                }
                connection = that.chosenConnection
            } 
            var query = '';
            for (key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            query = query + 'commandID=' + that.commandId + '&type=video';
            if (connection.uri.charAt(connection.uri.length-1) == '/'){
                //Remove a trailing / that some clients broadcast
                connection.uri = connection.uri.slice(0,connection.uri.length-1)
            }
            var _url = connection.uri + command + '?' + query
            global.log.info(_url)
            that.commandId = that.commandId + 1;
            var options = {
                url: _url,
                time: true,
                headers: {
                    'X-Plex-Device-Name':'PlexTogether',
                    'X-Plex-Client-Identifier': 'PlexTogether',
                    'X-Plex-Provides':'controller',
                    'X-Plex-Target-Client-Identifier':that.clientIdentifier
                },
                timeout: 5000
            }
            request(options, function (error, response, body) {
                //global.log.info(response)
                if (!error) {
                    parseXMLString(body, function(err,result){
                        if (err){
                            return callback(null,response.elapsedTime,response.statusCode)
                        }
                        return callback(result,response.elapsedTime,response.statusCode)
                    })
                } else {
                    return callback(null,null,response)
                }
            }) 
        }
        
    }

    this.findConnection = function(callback){
        //This function iterates through all available connections and 
        // if any of them return a valid response we'll set that connection
        // as the chosen connection for future use.
        var that = this;
        that.chosenConnection = null;
        for (var i in this.plexConnections){
            var connection = this.plexConnections[i]
            this.hitApi('/player/timeline/poll',{'wait':0},connection,function(result){
                if (that.chosenConnection != null){
                    //Looks like we've already found a good connection
                    // lets disregard this connection 
                    return(callback(true))
                }
                if (result != null){
                    if (result.MediaContainer != null){
                        that.chosenConnection = connection 
                        return(callback(true))
                    } else {
                        return(callback(false))
                    }
                } 
                return(callback(false))
                
            })            
        }
    }

    this.getTimeline = function(callback){
        var that = this
        //Get the timeline object from the client
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result,responseTime){
            if (result){
                //Valid response back from the client
                if (result.MediaContainer != null){
                    that.updateTimelineObject(result,responseTime,function(){
                        return callback(result.MediaContainer.Timeline,responseTime)
                    })
                    //return (callback(result.MediaContainer.Timeline,responseTime))
                }
                return callback(null,responseTime)
            } else {
                return callback(null,responseTime)
            }
        })
    }

    this.pressPlay = function(callback){
        //Press play on the client        
        this.hitApi('/player/playback/play',{'wait':0},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                return callback(result)
            } else {
                return callback(null)
            }
        })
    }    
    
    this.pressPause = function(callback){
        //Press pause on the client        
        this.hitApi('/player/playback/pause',{'wait':0},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                return callback(result)
            } else {
                return callback(null)
            }
        })
    }
    this.pressStop = function(callback){
        //Press pause on the client        
        this.hitApi('/player/playback/stop',{'wait':0},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                return callback(result)
            } else {
                return callback(null)
            }
        })
    }
    this.seekTo = function(time,callback){
        //Seek to a time (in ms)       
        this.hitApi('/player/playback/seekTo',{'wait':0,'offset':time},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                return callback(result)
            } else {
                return callback(null)
            }
        })
    }

    this.getRatingKey = function(callback){
        //Get the ratingKey, aka the mediaId, of the item playing        
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                var allTimelines = result.MediaContainer.Timeline
                for (var i in allTimelines){
                    var timeline = allTimelines[i]["$"]    
                    //We only want the rating key of whatever is playing in the video timeline                
                    if (timeline.type == 'video'){
                        return callback(timeline.ratingKey)
                    }
                }
                return callback(null)
            } else {
                return callback(null)
            }
        })
    }

    this.getServerId = function(callback){
        //Get the machineId of the server we're playing from'    
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                var allTimelines = result.MediaContainer.Timeline
                for (var i in allTimelines){
                    var timeline = allTimelines[i]["$"]    
                    //We only want the rating key of whatever is playing in the video timeline                
                    if (timeline.type == 'video'){
                        return callback(timeline.machineIdentifier)
                    }
                }
                return callback(null)
            } else {
                return callback(null)
            }
        })
    }

    this.getPlayerState = function(callback){
        //Get the Player State (playing, paused or stopped)      
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result){
            if (result){
                //Valid response back from the client
                var allTimelines = result.MediaContainer.Timeline
                for (var i in allTimelines){
                    var timeline = allTimelines[i]["$"]    
                    //We only want the rating key of whatever is playing in the video timeline                
                    if (timeline.type == 'video'){
                        return callback(timeline.state)
                    }
                }
                return callback(null)
            } else {
                return callback(null)
            }
        })
    }

    this.getPlayerTime = function(callback){
        //Get the current playback time in ms    
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result,responseTime,code){
            global.log.info('getPlayerTime result: ' + result)
            global.log.info('getPlayerTime code: ' + code)
            if (result){
                //Valid response back from the client
                var allTimelines = result.MediaContainer.Timeline
                for (var i in allTimelines){
                    var timeline = allTimelines[i]["$"]    
                    //We only want the rating key of whatever is playing in the video timeline                
                    if (timeline.type == 'video'){
                        return callback(timeline.time,responseTime)
                    }
                }
                return callback(null,responseTime)
            } else {
                return callback(null,responseTime)
            }
        })
    }

    this.playMedia = function(key,serverObject,callback){
        //Play a media item given a mediaId key and a server to play from
        //We need the following variables to build our paramaters:
        //MediaId Key, Offset (0 for simplicity), server MachineId,
        //Server Ip, Server Port, Server Protocol, Path 
        var command = '/player/playback/playMedia'
        var mediaId = '/library/metadata/' + key
        var offset = 0
        var serverId = serverObject.clientIdentifier
        var address = serverObject.chosenConnection.address
        var port = serverObject.chosenConnection.port
        var protocol = serverObject.chosenConnection.protocol
        var path = serverObject.chosenConnection.uri + mediaId

        var params = {

            'X-Plex-Client-Identifier' : 'PlexTogether',
            'key' : mediaId,
            'offset' : offset,
            'machineIdentifier' : serverId,
            'address' : address,
            'port' : port,
            'protocol' : protocol,
            'path' : path,
            'wait' : 0,
            'token': serverObject.accessToken
        }
        //Now that we've built our params, it's time to hit the client api
        this.hitApi(command,params,this.chosenConnection,function(result,that,code){
            global.log.info('play result: ')
            global.log.info(result)
            global.log.info(code)
            if (result != null){
                return callback(result,code,that)
            }
            else {
                return callback(false,code,that)
            }
            //global.log.info(that.name + ' returned ' + result)
        })
    }
    this.subscribe = function(callback) {
        var that = this
        doRequest()
        function doRequest() {
            // Already have a valid http server running, lets send the request
            let tempId = 'PlexTogether' + new Date().getTime()
            var command = '/player/timeline/subscribe'
            var params = {
                'port':that.subscribePort,
                'protocol':'http',
                'X-Plex-Device-Name':'PlexTogether'            
            }
            //Now that we've built our params, it's time to hit the client api

            var query = '';
            for (key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            query = query + 'commandID=' + that.commandId + '&type=video';
            if (connection.uri.charAt(connection.uri.length-1) == '/'){
                //Remove a trailing / that some clients broadcast
                connection.uri = connection.uri.slice(0,connection.uri.length-1)
            }
            if (that.chosenConnection == null) {
                // It is possible to try to subscribe before we've found a working connection
                global.log.info('Chosen connection has not been set yet.')
                return(callback(false))
            }
            var _url = that.chosenConnection.uri + command + '?' + query
            //global.log.info('subscription url: ' + _url)
            that.commandId = that.commandId + 1;
            var options = {
                url: _url,
                time: true,
                headers: {
                    'X-Plex-Device-Name':'PlexTogether',
                    'X-Plex-Client-Identifier': 'PlexTogether_' + that.uuid,
                    'X-Plex-Provides':'controller',
                    'X-Plex-Target-Client-Identifier':that.clientIdentifier
                },
                timeout: 5000
            }
            request(options, function (error, response, body) {
                //console.log('subscription result below')
                if (!error) {
                    return callback(true,that)
                } else {
                    return callback(false,that)
                }
            }) 
        }
    }
    this.unsubscribe = function(callback) {
        var that = this
        doRequest()
        function doRequest() {
            // Already have a valid http server running, lets send the request
            let tempId = 'PlexTogether' + new Date().getTime()
            var command = '/player/timeline/unsubscribe'
            var params = {
                'port':that.subscribePort,
                'protocol':'http',
                'X-Plex-Device-Name':'PlexTogether'            
            }
            //Now that we've built our params, it's time to hit the client api

            var query = '';
            for (key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            query = query + 'commandID=' + that.commandId + '&type=video';
            if (connection.uri.charAt(connection.uri.length-1) == '/'){
                //Remove a trailing / that some clients broadcast
                connection.uri = connection.uri.slice(0,connection.uri.length-1)
            }
            if (that.chosenConnection == null) {
                // It is possible to try to subscribe before we've found a working connection
                global.log.info('Chosen connection has not been set yet.')
                return(callback(false))
            }
            var _url = that.chosenConnection.uri + command + '?' + query
            global.log.info('subscription url: ' + _url)
            that.commandId = that.commandId + 1;
            var options = {
                url: _url,
                time: true,
                headers: {
                    'X-Plex-Device-Name':'PlexTogether',
                    'X-Plex-Client-Identifier': 'PlexTogether' + that.uuid,
                    'X-Plex-Provides':'controller',
                    'X-Plex-Target-Client-Identifier':that.clientIdentifier
                },
                timeout: 5000
            }
            request(options, function (error, response, body) {
                if (!error) {
                    return callback(true,that)
                } else {
                    return callback(false,that)
                }
            }) 
        }
    }
}