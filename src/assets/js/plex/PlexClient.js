var request = require('request');
var safeParse = require("safe-json-parse/callback")
var parseXMLString = require('xml2js').parseString;
const EventEmitter = require('events');

var PlexServer = require('./PlexServer.js')
var PlexTv = require('./PlexTv.js')
var PlexConnection = require('./PlexConnection.js')
var _PlexAuth = require('./PlexAuth.js')
var PlexAuth = new _PlexAuth()

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
    this.events = new EventEmitter();

    // Latest objects for reference in the future
    this.lastRatingKey = null;
    this.lastTimelineObject = null;
    this.oldTimelineObject = null;
    this.clientPlayingMetadata = null;
    this.lastSubscribe = 0;
    this.connectedstatus = 'fresh';

    this.eventbus = window.EventBus; // Assigned early on - we will use this to communicate with the PT Player

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

    this.hitApi = function(command,params,connection,callback){
        var that = this;
        //console.log('Time since last subscription command: ' + (new Date().getTime() - this.lastSubscribe))
        

        // Check if our client is the inline PTPlayer 
        // PTPlayer will have a client identifier of PTPLAYER9PLUS10

        if (this.clientIdentifier == 'PTPLAYER9PLUS10'){
            // We are using the PT Player

            let data = {
                command: command,
                params: params,
                callback: function(resultData){
                    callback(resultData, 0, 200, 'PTPLAYER')
                }
            }
            console.log('Sending our client the command ' + data.command)
            that.eventbus.$emit('command', data)


        } else {
            console.log('Interacting with a standard client')
            if ( (new Date().getTime() - this.lastSubscribe) > 29000 ) {
                // We need to subscribe first!
                this.subscribe(function(result){
                    //console.log('subscription result: ' + result)
                    if (result) {
                        that.lastSubscribe = new Date().getTime()
                    }
                    doRequest()
                    return
                })
            } else {
                doRequest()
                return
            }        
            function doRequest(){
                if (connection == null){
                    if (that.chosenConnection == null){
                        console.log('You should find a working connection via #findConnection first!')
                    }
                    connection = that.chosenConnection
                } 
                var query = '';
                for (let key in params) {
                    query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
                }
                query = query + 'commandID=' + that.commandId + '&type=video';
                if (connection.uri.charAt(connection.uri.length-1) == '/'){
                    //Remove a trailing / that some clients broadcast
                    connection.uri = connection.uri.slice(0,connection.uri.length-1)
                }
                var _url = connection.uri + command + '?' + query
                that.commandId = that.commandId + 1;
                var options = PlexAuth.getClientApiOptions(_url, that.clientIdentifier, null, 5000);
                request(options, function (error, response, body) {
                    //console.log(response)
                    if (!error) {
                        parseXMLString(body, function(err,result){
                            if (err){
                                return callback(null,response.elapsedTime,response.statusCode,connection)
                            }
                            return callback(result,response.elapsedTime,response.statusCode,connection)
                        })
                    } else {
                        return callback(null,null,response,connection)
                    }
                }) 
            }
        }

        
        
    }

    this.findConnection = function(callback){
        //This function iterates through all available connections and 
        // if any of them return a valid response we'll set that connection
        // as the chosen connection for future use.
        var that = this;
        var attempts = 0;
        that.chosenConnection = null;
        let returned = false
        if (this.clientIdentifier == 'PTPLAYER9PLUS10'){
            console.log('Found connection for ptplayer')
            this.chosenConnection = true
            return callback(true)
        }
        for (var i in this.plexConnections){
            var connection = this.plexConnections[i]
            this.hitApi('/player/timeline/poll',{'wait':0},connection,function(result,elapsedTime,statusCode,connectionUsed){
                attempts++  
                console.log('Connection result for ' + connectionUsed.address)
                console.log(result)
                if (result != null){
                    if (result.MediaContainer != null){
                        if (that.chosenConnection == null) {
                            that.chosenConnection = connectionUsed 
                            returned = true
                            return (callback(true))
                        }
                    } 
                }             
                if (attempts == that.plexConnections.length){
                    if (that.chosenConnection != null) {
                        if (!returned){
                            return(callback(true))
                        }
                    } else {
                        if (!returned){
                            return(callback(false))
                        }
                    }
                }                
            })            
        }
    }
    this.checkConnectability = function(callback){
        var that = this
        // Hit the /resources endpoint to see if the client is compatible
        if (!this.chosenConnection){
            // Get a valid connection first
            this.findConnection(function(result){            
                if (!result){
                    return callback(false,that)
                }
                getResources()
                return
            })
            return            
        }   
        getResources()
        return


        function getResources(){
            that.hitApi('/resources/',{'wait':0},that.chosenConnection,function(result,responseTime){
                if (result){
                    //Valid response back from the client
                    if (result.MediaContainer != null){
                        return callback(true,that)
                    } else {
                        return callback(false,that)
                    }
                } else {
                    return callback(false,that)
                }
            })
        }
    }

    this.getTimeline = function(callback){
        var that = this
        //Get the timeline object from the client
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result,responseTime){
            
            if (result){
                if (that.clientIdentifier == 'PTPLAYER9PLUS10'){                    
                    that.updateTimelineObject(result,-1,function(){
                        return callback(result,0)
                    })
                    return
                }
                //console.log(JSON.stringify(result,null,4))
                //Valid response back from the client
                if (result.MediaContainer != null){
                    that.updateTimelineObject(result,responseTime,function(){
                        return callback(result,responseTime)
                    })
                    //return (callback(result.MediaContainer.Timeline,responseTime))
                } else {
                    return callback(null,responseTime)
                }
            } else {
                return callback(false,responseTime)
            }
        })
    }

    
    this.updateTimelineObject = function(result,responseTime,callback) {

        if (responseTime == -1){   
            // PTPLAYER         
            this.events.emit('new_timeline',result)
            console.log(result)
            var clonetimeline = this.lastTimelineObject
            this.lastTimelineObject = result
            this.lastTimelineObject.recievedAt = new Date().getTime()
            if (!this.oldTimelineObject){
                if (!this.lastTimelineObject.ratingKey){
                    this.events.emit('playback_change',null)
                } else {                        
                    this.events.emit('playback_change',this.lastTimelineObject.ratingKey)
                }               
                this.oldTimelineObject = result
                return callback(result)
            }
            this.oldTimelineObject = clonetimeline
            if (this.oldTimelineObject.ratingKey != this.lastTimelineObject.ratingKey){
                if (!this.lastTimelineObject.ratingKey){
                    this.events.emit('playback_change',null)
                } else {
                    this.events.emit('playback_change',this.lastTimelineObject.ratingKey)
                }
            }
            return callback(result)
        }
                
        if (!result.MediaContainer.Timeline){
            // Not a valid timeline object
            return
        }
        // Valid timeline data
        if (responseTime != null) {
            this.lastResponseTime = responseTime
        }
        // Standard player
        let timelines = result.MediaContainer.Timeline
        for (let i = 0; i < timelines.length; i++){
            let _timeline = timelines[i]['$']
            if (_timeline.type == 'video') {
                this.events.emit('new_timeline',timelines[i]['$'])
                var clonetimeline = this.lastTimelineObject
                this.lastTimelineObject = timelines[i]['$']
                this.lastTimelineObject.recievedAt = new Date().getTime()
                if (!this.oldTimelineObject){
                    // First time we've got data!            
                    if (!this.lastTimelineObject.ratingKey){
                        this.events.emit('playback_change',null)
                    } else {                        
                        this.events.emit('playback_change',this.lastTimelineObject.ratingKey)
                    }
                    this.oldTimelineObject  = timelines[i]['$']
                    return callback(timelines[i]['$'])
                }
                this.oldTimelineObject = clonetimeline
                if (this.oldTimelineObject.ratingKey != this.lastTimelineObject.ratingKey){
                    if (!this.lastTimelineObject.ratingKey){
                        this.events.emit('playback_change',null)
                    } else {
                        this.events.emit('playback_change',this.lastTimelineObject.ratingKey)
                    }
                }
                return callback(timelines[i]['$'])
            }
        }
        return callback(null)
    }
    this.pressPlay = function(callback){
        //Press play on the client        
        this.hitApi('/player/playback/play',{'wait':0},this.chosenConnection,function(result,responseTime){
            if (result){
                //Valid response back from the client
                return callback(result,responseTime)
            } else {
                return callback(null)
            }
        })
    }    
    
    this.pressPause = function(callback){
        //Press pause on the client        
        this.hitApi('/player/playback/pause',{'wait':0},this.chosenConnection,function(result,responseTime){
            if (result){
                //Valid response back from the client
                return callback(result,responseTime)
            } else {
                return callback(null)
            }
        })
    }
    this.pressStop = function(callback){
        //Press pause on the client        
        this.hitApi('/player/playback/stop',{'wait':0},this.chosenConnection,function(result,responseTime){
            if (result){
                //Valid response back from the client
                return callback(result,responseTime)
            } else {
                return callback(null)
            }
        })
    }
    this.seekTo = function(time,callback){
        //Seek to a time (in ms)       
        this.hitApi('/player/playback/seekTo',{'wait':0,'offset':time},this.chosenConnection,function(result,responseTime){
            if (result){
                //Valid response back from the client
                return callback(result,responseTime)
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
        var that = this
        // First lets mirror the item so the user has an idea of what we're about to play

        function send(){
            let command = '/player/playback/playMedia'
            let mediaId = '/library/metadata/' + key
            let offset = 0
            let serverId = serverObject.clientIdentifier
            let address = serverObject.chosenConnection.address
            let port = serverObject.chosenConnection.port
            let protocol = serverObject.chosenConnection.protocol
            let path = serverObject.chosenConnection.uri + mediaId

            let params = {

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
            that.hitApi(command,params,that.chosenConnection,function(result,the,code){
                console.log('play result: ')
                console.log(code)
                if (result != null){
                    return callback(result,code,that)
                }
                else {
                    return callback(false,code,that)
                }
                //console.log(that.name + ' returned ' + result)
            })
        }
        if (this.clientIdentifier == 'PTPLAYER9PLUS10'){
            send()
        } else {
            this.mirrorContent(key,serverObject,function(){
                send()
            })
        }
        
    }
    this.mirrorContent = function(key,serverObject,callback) {
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

            'X-Plex-Client-Identifier' : 'PlexTogether',
            'key' : mediaId,
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
            if (result != null){
                return callback(result,code,that)
            }
            else {
                return callback(false,code,that)
            }
        })
    }
    this.subscribe = function(callback) {
        var that = this
        doRequest()
        function doRequest() {
            // Already have a valid http server running, lets send the request            
            if (that.chosenConnection == null) {
                // It is possible to try to subscribe before we've found a working connection
                return(callback(false))
            }
            let tempId = 'PlexTogetherWeb'
            var command = '/player/timeline/subscribe'
            var params = {
                'port':that.subscribePort,
                'protocol':'http',
                'X-Plex-Device-Name':'PlexTogether'            
            }
            //Now that we've built our params, it's time to hit the client api

            var query = '';
            for (let key in params) {
                query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
            }
            query = query + 'commandID=' + that.commandId + '&type=video';
            if (that.chosenConnection.uri.charAt(that.chosenConnection.uri.length-1) == '/'){
                //Remove a trailing / that some clients broadcast
                that.chosenConnection.uri = that.chosenConnection.uri.slice(0,that.chosenConnection.uri.length-1)
            }

            var _url = that.chosenConnection.uri + command + '?' + query
            //console.log('subscription url: ' + _url)
            that.commandId = that.commandId + 1;
            var options = PlexAuth.getClientApiOptions(_url, that.clientIdentifier, that.uuid, 5000);
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
            let tempId = 'PlexTogether'
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
                console.log('Chosen connection has not been set yet.')
                return(callback(false))
            }
            var _url = that.chosenConnection.uri + command + '?' + query
            console.log('subscription url: ' + _url)
            that.commandId = that.commandId + 1;
            var options = PlexAuth.getClientApiOptions(_url, that.clientIdentifier, that.uuid, 5000);
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