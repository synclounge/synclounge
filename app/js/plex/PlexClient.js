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

    //Latest objects for reference in the future
    this.lastRatingKey = null;
    this.lastTimelineObject = null;
    this.clientPlayingMetadata = null;


    //Functions
    
    this.hitApi = function(command,params,connection,callback){
        if (connection == null){
            if (this.chosenConnection == null){
                console.log('You should find a working connection via #findConnection first!')
            }
            connection = this.chosenConnection
        } 
        var query = '';
        for (key in params) {
            query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
        }
        query = query + 'commandID=' + this.commandId + '&type=video';
        if (connection.uri.charAt(connection.uri.length-1) == '/'){
            //Remove a trailing / that some clients broadcast
            connection.uri = connection.uri.slice(0,connection.uri.length-1)
        }
        var _url = connection.uri + command + '?' + query
        console.log(_url)
        this.commandId = this.commandId + 1;
        var options = {
            url: _url,
            time: true,
            headers: {
                'X-Plex-Device-Name':'PlexTogether',
                'X-Plex-Client-Identifier': 'PlexTogether',
                'X-Plex-Target-Client-Identifier':this.clientIdentifier
            },
            timeout: 5000
        }
        var that = this;
        request(options, function (error, response, body) {
            this.commandId = this.commandId + 1
            //console.log(response)
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
        //Get the timeline object from the client
        this.hitApi('/player/timeline/poll',{'wait':0},this.chosenConnection,function(result,responseTime){
            if (result){
                //Valid response back from the client
                if (result.MediaContainer != null){
                    return (callback(result.MediaContainer.Timeline,responseTime))
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
            console.log('getPlayerTime result: ' + result)
            console.log('getPlayerTime code: ' + code)
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
            console.log('play result: ')
            console.log(result)
            console.log(code)
            if (result != null){
                return callback(result,that)
            }
            else {
                return callback(null, that)
            }
            //console.log(that.name + ' returned ' + result)
        })
    }
    this.subscribe = function(callback) {
        // Check if we've already got a http server running
        if (this.httpServer == null) {  
            this.httpServer = http.createServer( function(req, res) { 
                if (req.method == 'POST') {
                    res.writeHead(200, {'Content-Type': 'text/html'});
            
                    var body = '';
                    req.on('data', function (data) {
                        body += data;
                    });
                    req.on('end', function () {
                        // Check if we got a response from the client we want
                        if (req.headers['x-plex-client-identifier'] == this.clientIdentifier) {
                            parseXMLString(body, function(err,result){
                                if (!err) {
                                    //this.lastTimelineObject = result
                                }
                            })
                        }                        
                        res.end( '' );
                    });
                }
                else
                {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    var html = '<html><body>hey :)</body></html>';
                    res.end(html);
                }            
            });
            this.httpServer.on('error',function(e) {
                console.log('HTTP SERVER ERROR')
                console.log(e)
            })
            this.httpServer.listen(32500,'0.0.0.0')
            console.log('Server started')
        }
        // Already have a valid http server running, lets send the request
        this.tempId = 'PlexTogether' + new Date().getTime()
        var command = '/player/timeline/subscribe'
        var params = {
            'port':32500,
            'protocol':'http',
            'X-Plex-Device-Name':'PlexTogether'            
        }
        //Now that we've built our params, it's time to hit the client api
        this.hitApi(command,params,this.chosenConnection,function(result,that,code){
            console.log('Subscribe request below')
            console.log(code)
            if (result != null){
                return callback(result,that)
            }
            else {
                return callback(null, that)
            }
        })
    }
}