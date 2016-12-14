'use strict'
//var path = require('path')
//var io = require('socket.io-client')

const storage = require('electron-json-storage')
global.renderLog = require('electron-log')
renderLog.transports.file.format = '[Renderer] [{level}] {h}:{i}:{s}:{ms} {text}'

global.faderArray = []
global.hostReactions = []
global.nextPlayerAdjust = 0
global.nextPlayerSeek = true

var metadataIntervals = []
var ptServerTickers = []
var plexClientTickers = [];
var $ = require('jquery')

var clientTestInProgress = false

// Fetch our Plex Data
ipcRenderer.send('home-tab-initialize')
var arrowDirection = 'arrow_drop_down';

ipcRenderer.send('home-tab-me-avatar')
  // Sidebar/tab handling
ipcRenderer.on('home-tab-me-avatar-result', function(event, result, path) {
  var relPath
  if (result === true) {
    // Download succeeded
    relPath = path
  } else {
    relPath = 'img/safetyAvatar.png'
  }
  document.getElementById('meAvatar').src = relPath
})
ipcRenderer.on('home-tab-initialize-result', function(event, username, clients, servers) {
    updateSelfUserUsername(username)

    ipcRenderer.send('ptmain-thumb-download')
      // document.getElementById('plexUsername').innerHTML = username
      // Handle clients
    var endClients = ''
    for (let i in clients) {
      var client = clients[i]
      endClients = endClients +
        '<span class="nav-group-item plexClient sideNav" plexId="' + client.clientIdentifier + '">\
                            <span href="#" plexId="' + client.clientIdentifier + '" style="color: #fff cursor:pointer"> ' + client.name + '</span>\
                           </span>'
    }
    document.getElementById('plexPlayers').innerHTML = endClients
      // Handle Servers
    var endServers = ''
    for (let i in servers) {
      var server = servers[i]
      endServers = endServers +
        '<span class="nav-group-item plexServer sideNav"plexId="' + server.clientIdentifier + '">\
                            <span href="#" plexId="' + server.clientIdentifier + '" style="color: #fff cursor:pointer"> ' + server.name + '</span>\
                           </span>'
    }
    document.getElementById('plexServers').innerHTML = endServers

    // Now that we've set the items in the list, lets add our listeners for clicks
    var clientsObj = document.querySelectorAll('.plexClient')
    for (let i = 0; i < clientsObj.length; i++) {
      clientsObj[i].addEventListener('click', function(event) {
        if (clientTestInProgress) {
          return
        }
        clientTestInProgress = true
        var clientId = event.toElement.getAttribute('plexId')
        event.toElement.style.color = '#ffb74d'
        var plex = remote.getGlobal('plex')
        if (plex.chosenClient != null) {
          plex.chosenClient.clearEvents(function() {})
          plex.chosenClient.unsubscribe(function() {})
        }
        ipcRenderer.send('home-tab-clientclicked', clientId)
        for (var x in plex.clients) {
          var client = plex.clients[x]
          client.lastRatingKey = null
          client.lastTimelineObject = null
        }
      })
    }
    var serversObj = document.querySelectorAll('.plexServer')
    for (let i = 0; i < serversObj.length; i++) {
      serversObj[i].addEventListener('click', function(event) {
        var clientId = event.toElement.getAttribute('plexId')
        event.toElement.style.color = '#fff'
        ipcRenderer.send('home-tab-serverclicked', clientId)
      })
    }
  })
  //Handle logout
function logoutPlexTv() {
  global.renderLog.info('we want to signout!')
  ipcRenderer.send('plextv-signout')
  return
}
//Handle Client/Server clicking responses
ipcRenderer.on('home-tab-serverclicked-result', function(event, result, server) {
  if (!result) {
    // No preferred server! 
    fireNotification('Plex Server', 'Successfully removed your prefered server. We will attempt to play from any server.')
    return
  }
  var serversObj = document.querySelectorAll('.plexServer')
  for (let i = 0; i < serversObj.length; i++) {
    var iterServer = serversObj[i]
    var child = iterServer.childNodes[1]
    child.style.color = '#fff'
    global.renderLog.info('result:' + result)
    if (server.clientIdentifier == iterServer.getAttribute('plexId')) {
      if (result) {
        fireNotification('Plex Server', 'Successfully set your prefered server to ' + server.name)
          // The swap was a success, reflect this!
        child.style.color = '#1ECD97'
      } else {
        child.style.color = '#fff'
      }
    }
  }

})
ipcRenderer.on('home-tab-clientclicked-result', function(event, result, client) {

  //console.log('Set port to ' + plex.httpServerPort)
  var clientsObj = document.querySelectorAll('.plexClient')
  for (let i = 0; i < clientsObj.length; i++) {
    var iterClient = clientsObj[i]
    var child = iterClient.childNodes[1]
    var oldColor = child.style.color + ''
    child.style.color = '#fff'
    if (client.clientIdentifier == iterClient.getAttribute('plexId')) {
      global.hostReactions = []

      for (let x; x < global.safetyHostReactions; x++) {
        clearTimeout(global.safetyHostReactions[x])
      }
      if (result) {
        //The swap was a success, reflect this!
        child.style.color = '#1ECD97'
          //We need to start our interval for checking for Now Playing
          //We also need to kill the other interval checkers
        for (var j in metadataIntervals) {
          clearInterval(metadataIntervals[j])
        }
        var ratingKeyInterval = setInterval(function(result) {
          checkRatingKey()
        }, 5000)
        metadataIntervals.push(ratingKeyInterval)
        document.getElementById('metaPlayer').innerHTML = client.name
      } else {
        //The swap wasn't a success, reflect this!'
        child.style.color = '#FF262E'
        for (var j in metadataIntervals) {
          clearInterval(metadataIntervals[j])
        }
      }
    }
  }
  clientTestInProgress = false

})

//Handle client actions
function checkRatingKey() {
  //General flow will be:
  // -Get the timeline object
  //	--Check the rating key of old Vs new
  //	---If they're different, retrieve new metadata from PMS
  //global.renderLog.info('Checking the rating key')
  var plex = remote.getGlobal('plex')
  if (!plex.chosenClient) {
    return
  }
  plex.chosenClient.getTimeline(function(result, responseTime) {
    console.log(plex.chosenClient.lastTimelineObject)
    if (!result) {
      return
    }
    var newRatingKey = plex.chosenClient.lastTimelineObject.ratingKey
    var newTimelineObject = plex.chosenClient.lastTimelineObject
      //Check our ratingKeys to see if we need to get new Metadata
      //global.renderLog.info('ratingKey: ' + newRatingKey)
    if (newRatingKey == null || newRatingKey == undefined) {
      //$('.mainUser').find('.ptuser-title').text('Nothing is playing on ' + plex.chosenClient.name)
      document.getElementById('metaDropdownDiv').style.display = 'none'
      document.getElementById('userMetadata').style.display = 'none'
        //document.getElementById('mainUser').style.boxshadow = '0 2px 5px 0 rgba(0, 0, 0, 0.16)'
    }
    if (plex.chosenClient.lastRatingKey != newRatingKey) {
      if (plex.chosenClient.lastRatingKey != null && newRatingKey == null) {
        //We just stopped playing something
        plex.chosenClient.lastRatingKey = newRatingKey
        return
      }
      global.renderLog.info('We have change what we are playing on this client. Attempting to fetch metadata now')
        /*
        Looks like we've changed what we were playing
        We now need to fetch the metadata from the server
        The server may not actually be our prefered server
            so we'll need to go through all our server to find
            the server we're playing from
        */
      var serverId = newTimelineObject.machineIdentifier
      for (var x in plex.servers) {
        var server = plex.servers[x]
        if (server.clientIdentifier == serverId) {

          //This is the server we're playing from
          //Lets fetch the metadata from that server

          server.getMediaByRatingKey(newRatingKey, function(res) {
            global.renderLog.info('Got Metadata by rating key below from server ' + server.name)
              //global.renderLog.info(res)
            if (res) {
              //Valid response from the PMS

              if (document.getElementById('metaDropdownDiv').style.display != 'block') {
                document.getElementById('metaDropdownDiv').style.display = 'block'
              }
              plex.chosenClient.clientPlayingMetadata = res
              plex.chosenClient.lastRatingKey = newRatingKey
              plex.chosenClient.lastTimelineObject = newTimelineObject
              plex.chosenClient.lastTimelineObject.recievedAt = new Date().getTime()
              updateMeta(server)
            } else {
              global.renderLog.info('Failed to retrieve metadata from rating key ' + newRatingKey)
            }
          })
          break
        }
      }
    }
  })
}

function updateMeta(server) {
  // This function will only be fired when we have changed what we're playing or
  // we just want a timed update
  var plex = remote.getGlobal('plex')
  var metadata = plex.chosenClient.clientPlayingMetadata
    // document.getElementById('metaServer').innerHTML = server.name
  ipcRenderer.send('home-metadata-download', server, metadata)
}
// This is the reply from the above
ipcRenderer.on('home-metadata-download-result', function(event, result, path) {
  global.renderLog.info('metadata download result below')
  global.renderLog.info(result)
  if (result) {
    var plex = remote.getGlobal('plex')
    var metadata = plex.chosenClient.clientPlayingMetadata
    global.renderLog.info(metadata)
      // First we need to determine if this is a series or a movie
    var title
    var season
    var episode
    if (metadata.type == 'movie') {
      title = metadata.title
    } else {
      title = metadata.grandparentTitle
      season = metadata.parentIndex
      episode = metadata.index
    }
    var under
    if (metadata.type == 'episode') {
      under = metadata.title + '<br>S' + season + '&#183E' + episode
    } else {
      if (metadata.tagline == undefined) {
        metadata.tagline = ''
      }
      under = metadata.tagline + ' (' + metadata.year + ')'
    }

    document.getElementById('metaThumb').src = path + '#' + new Date().getTime()
    document.getElementById('metaUnder').innerHTML = under

    //Display Metadata + play controls
    $('#userMetadata').css('display', 'block');
    $('.plexServerClientInfo').css({
      'height': 'calc(100% - 401px)'
    })

  }
})
ipcRenderer.on('ptuser-thumb-download-result', function(event, result, path, userData) {
  var relPath
  if (result == true) {
    // Download succeeded
    relPath = path
  } else {
    relPath = 'img/safetyAvatar.png'
  }
  addPTUserFinish(userData, relPath)
})
ipcRenderer.on('ptmain-thumb-download-result', function(event, result, path) {
  var relPath
  if (result == true) {
    // Download succeeded
    relPath = path
  } else {
    relPath = 'img/safetyAvatar.png'
  }
  document.getElementById('meAvatar').src = relPath
  document.getElementById('ptmain-avatar').src = relPath
    // We can now show the window
  ipcRenderer.send('pt-did-finish-load')
})
ipcRenderer.on('start-handling-room-events', function(event) {
  roomEvents()
})
ipcRenderer.on('pt-sendPoll-manual', function(event) {
  console.log('Sending manual poll data')
  sendValidData()
})

function roomEvents() {
  var plex = remote.getGlobal('plex')

  // Create a ticker that will hit the client every x
  // and then send that off to the server

  var timelineTicker = setInterval(function() {
    sendPoll()
  }, 2500)
  plexClientTickers.push(timelineTicker)
}

function sendPoll() {
  var plex = remote.getGlobal('plex')
  if (plex.chosenClient == null || plex.chosenClient == undefined) {
    return
  }
  plex.chosenClient.getTimeline(function(result, responseTime) {
    sendValidData()
  })
}

function sendValidData() {
  var plex = remote.getGlobal('plex')
  var temp = {}
  if (plex.chosenClient == null || plex.chosenClient.lastTimelineObject == null ||
    plex.chosenClient.lastTimelineObject.state == 'stopped') {
    if (remote.getGlobal('ourUser') == undefined) {
      return
    }
    // Nothing is playing
    temp.username = remote.getGlobal('ourUser').username
    temp.time = null
    temp.maxTime = null
    temp.title = null
    temp.playerState = null
    temp.clientResponseTime = null
    temp.showName = null
    temp.type = null
    if (plex.chosenClient != null) {
      plex.chosenClient.lastMessageToServer = temp
    }
    ipcRenderer.send('pt-sendPoll', temp)
    return
  }
  var time = -1
  var maxTime = -1
  var title = null
  var playerState = null
  var rawTitle = null
  var showName = null

  time = plex.chosenClient.lastTimelineObject.time
  var seekRange = plex.chosenClient.lastTimelineObject.seekRange
  if (seekRange == null) {
    maxTime = null
  } else {
    maxTime = seekRange.substring(seekRange.indexOf('-') + 1, seekRange.length)
  }

  if (plex.chosenClient.clientPlayingMetadata != null) {
    //Good connection to the PMS
    var metadata = plex.chosenClient.clientPlayingMetadata
    if (metadata == null) {
      global.renderLog.info('Dont have valid metadata :(')
      return
    }
    temp.type = metadata.type
    temp.showName = metadata.grandparentTitle
    rawTitle = metadata.title
    if (metadata.type == 'episode') {
      title = metadata.grandparentTitle + ' - ' + metadata.title + ' S' + metadata.parentIndex +
        '&#183' + 'E' + metadata.index
    } else {
      title = metadata.title + ' (' + metadata.year + ')'
    }
  } else {
    title = 'Nothing'
  }

  playerState = plex.chosenClient.lastTimelineObject.state
  if (remote.getGlobal('ourUser') == undefined) {
    return
  }
  temp.username = remote.getGlobal('ourUser').username
  temp.time = time
  temp.maxTime = maxTime
  temp.title = title
  temp.rawTitle = rawTitle
  temp.playerState = playerState
  temp.clientResponseTime = plex.chosenClient.lastResponseTime


  if (plex.chosenClient != null) {
    plex.chosenClient.lastMessageToServer = temp
  }
  ipcRenderer.send('pt-sendPoll', temp)
}

function userData() {
  this.username = null
  this.role = null
  this.title = null
  this.time = null
  this.maxTime = null
  this.lastHeartbeat = null
}

function handleHostUpdate(data) {
  // We must decide if we want to act on the host data
  // First lets check if we're waiting for a previous action to finish
  var ourUser = remote.getGlobal('ourUser')
  if (ourUser.role == 'host') {
    // This is our own data!
    return
  }
  var plex = remote.getGlobal('plex')
  if (plex.chosenClient == null) {
    return
  }
  if (!plex.chosenClient.lastTimelineObject) {
    return
  }
  if (plex.chosenClient.lastMessageToServer == null) {
    // Need to wait for some data from our client first
    return
  }



  // Check if we're playing the same item
  if (data.title != plex.chosenClient.lastMessageToServer.title) {
    // We're not playing the same item!
    autoPlayHostContent(data, function(result) {
      global.renderLog.info('Play media item returned ' + result)
      return
    })
    return
  }

  // Check if we need to get fresh data from our client to prevent DDoSing our client
  if ((new Date().getTime() - plex.chosenClient.lastTimelineObject.recievedAt) > 1000) {
    plex.chosenClient.getTimeline(function(timelines, ourClientResponseTime) {
      handleSeek(ourClientResponseTime)
    })
  } else {
    // Pass through the amount of time that has passed since this timeline object was created
    // in an attempt to be more accurate
    handleSeek((new Date().getTime() - plex.chosenClient.lastTimelineObject.recievedAt))
  }

  function handleSeek(timeElapsed) {

    function resetAccess() {
      // We'll use this function to block all future requests to stop player control being confused and overlapped
      plex.chosenClient.nextPlayerSeekAvailable = true
        // Save this timelineObject so we can compare in the future
      plex.chosenClient.oldTimelineObject = plex.chosenClient.lastTimelineObject
    }


    let freshTime = plex.chosenClient.lastTimelineObject.time
    let freshPlayerState = plex.chosenClient.lastTimelineObject.state
    let ourClientResponseTime = plex.chosenClient.lastResponseTime

    if (plex.chosenClient.lastTimelineObject == null) {
      return
    }

    if (plex.chosenClient.nextPlayerSeekAvailable == undefined) {
      plex.chosenClient.nextPlayerSeekAvailable = true
    }
    if (plex.chosenClient.nextPlayerSeekAvailable == false) {
      return
    }
    plex.chosenClient.nextPlayerSeekAvailable = false
      // Heard back from our client

    if (plex.chosenClient == null) {
      // Nevermind, we've changed our chosen client
      resetAccess()
      return
    }
    if (plex.chosenClient.oldTimelineObject == undefined) {
      plex.chosenClient.oldTimelineObject = plex.chosenClient.lastTimelineObject
    } else {
      if (plex.chosenClient.oldTimelineObject == plex.chosenClient.lastTimelineObject) {
        // We've already checked all of this timelines data!
        //global.renderLog.info('Already checked this timeline object')
        resetAccess()
        return
      }
    }
    if (freshTime == null) {

      // Non-valid response
      global.renderLog.info('Invalid response from client')
      resetAccess()
      return
    }
    if (freshPlayerState == 'buffering') {
      global.renderLog.info('client is buffering!')
      resetAccess()
      return
    }
    //Check if we need to pause or unpause        }        
    if (data.playerState == 'paused' && freshPlayerState == 'paused') {
      //Need to press pause   
      resetAccess()
      return
    }
    if (data.playerState == 'playing' && freshPlayerState == 'paused') {
      //Need to press play
      fireNotification('Plex Together Sync', 'Host pressed play - pressing play now')
      plex.chosenClient.pressPlay(function() {
        resetAccess()
      })
      return
    }
    if (data.playerState == 'paused' && freshPlayerState == 'playing') {
      //Need to press pause
      fireNotification('Plex Together Sync', 'Host pressed pause - pressing pause now')
      plex.chosenClient.pressPause(function() {
        resetAccess()
      })
      return
    }
    /*
    Calculate the difference.
    The formala will be:

    Absolute value of (Host Time +
    (socketio response time * 2)
    + hosts client response time
    + our clients response time to
        get the freshest time
    ) - (freshTime +
    response time from clent for freshTime)


    */
    var responseTime = remote.getGlobal('socket').pollLastResponseTime
    var predictedTimePast = (+responseTime * 2) + +data.clientResponseTime + +ourClientResponseTime
    var predictedHostTime = +data.time + predictedTimePast + timeElapsed
    var ourTime = (+freshTime + +ourClientResponseTime)
    var difference = Math.abs(predictedHostTime - ourTime)
    global.renderLog.info('Difference from host is ' + difference)
    let status = 'behind'
    if (ourTime > predictedHostTime) {
      status = 'ahead'
    }
    console.log('We are ' + status)
    console.log('Our Socket Response time: ' + responseTime)
    console.log('Predicted time past since this host data: ' + predictedTimePast)
    console.log('The predicted time our host is at ' + predictedHostTime)
    console.log('The hosts raw time: ' + data.time)
    console.log('Our raw time: ' + plex.chosenClient.lastTimelineObject.time)
    console.log('Our predicted time ' + ourTime)
    console.log('The difference: ' + difference)
    if (difference > 3000) {
      //We're too far out, we should seek to the same time
      //Check if they're actually playing something.. 
      if (data.title == null || data.title == 'Nothing') {
        resetAccess()
        return
      }


      var seekTime = parseInt(predictedHostTime)
      var waitTime = 0
      if (data.playerState == 'playing') {
        if (plex.chosenClient.bufferTime == undefined) {
          plex.chosenClient.bufferTime = 0
        }
        seekTime = seekTime + plex.chosenClient.bufferTime
        console.log('We are going to be seeking ahead ' + seekTime)
        waitTime = 3000
      }
      fireNotification('Plex Together Sync', 'Seeking to get back inline with the host')
      plex.chosenClient.seekTo(seekTime, function(result) {
        checkBufferTime()
        if (data.playerState == 'paused') {
          fireNotification('Plex Together Sync', 'Host pressed pause - pressing pause now')
          plex.chosenClient.pressPause(function() {
            resetAccess()
          })
          return
        } else {
          resetAccess()
        }
        /*plex.chosenClient.pressPause(function(res){
            setTimeout(function(){
                plex.chosenClient.pressPlay(function(rs){
                    return
                })
            },waitTime)
        })
        */
      })
      return
    } else {
      //We're all good

      resetAccess()
      return
    }
  }

  function autoPlayHostContent(hostData, callback) {
    /*This function handles auto playing content
    If the user has selected a server, we need
    to try and play from that server first. If
    unsuccessful, we need to try and play from
    other servers that are available
    */

    //First we should send a stop command
    if ((new Date().getTime() - global.nextPlayerAdjust) > 20000) {
      global.nextPlayerAdjust = new Date().getTime()

      function checkResult(data) {
        //Do a series of checks to see if this result is OK
        //Check if content type matches
        if (data.type != hostData.type) {
          //global.renderLog.info('wrong type')
          return false
        }
        //Check if rawTitle matches
        if (data.title != hostData.rawTitle) {
          //global.renderLog.info('wrong title')
          return false
        }
        //Check if length is close enough
        if (Math.abs(data.duration - hostData.maxTime) > 5000) {
          //global.renderLog.info('wrong time')
          return false
        }
        if (hostData.type == 'movie') {
          //We're good!
          global.renderLog.info('FOUND A PLAYABLE MOVIE')
          return true
        }
        if (hostData.type == 'episode') {
          //Check if the show name is the same
          if (hostData.showName != data.grandparentTitle) {
            //global.renderLog.info('wrong showname')
            return false
          } else {
            global.renderLog.info('FOUND A PLAYABLE TV')
            return true
          }

        }
        return false
      }
      var playables = []
      var serversHit = []
      if (hostData.title === null) {
        return
      }
      if (plex.chosenServer != null) {
        fireNotification('Plex Together AutoPlay', 'Searching ' + plex.chosenServer.name + ' for ' + hostData.title)
          //User has chosen a server
          //Hit the server for a list of all results
        plex.chosenServer.search(hostData.rawTitle, function(results) {
          if (results != null) {
            //Valid result
            for (var i = 0; i < results.length; i++) {
              //Now we need to check the result
              if (checkResult(results[i])) {
                //Its a match!
                playables.push({
                  'server': plex.chosenServer,
                  'result': results[i]
                })

              }
            }
            playPlayables(0)
          } else {
            fireNotification('Plex Together AutoPlay', 'Your chosen server: ' + plex.chosenServer.name + ' doesn\'t have an identitical copy of ' + hostData.title)
            return (callback(false))
          }
        })
      } else {
        //Loop through all servers
        fireNotification('Plex Together AutoPlay', 'Searching all available servers for ' + hostData.title)
        for (let i = 0; i < plex.servers.length; i++) {
          var server = plex.servers[i]
          server.search(hostData.rawTitle, function(results, fromServer) {
            serversHit.push(fromServer)
            if (results != null) {
              //Valid result
              for (let j = 0; j < results.length; j++) {
                //Now we need to check the result
                if (checkResult(results[j])) {
                  //Its a match!
                  playables.push({
                    'server': fromServer,
                    'result': results[j]
                  })
                }

              }
            }
            //Check if we're the last server to respond
            if (serversHit.length == plex.servers.length) {
              //We're the last server
              global.renderLog.info('Heard back from the last server')
              playPlayables(0)
            }
          })
        }
      }

      function playPlayables(index) {
        //We'll use this function to slowly loop through all of the playables
        global.renderLog.info('At playables loop ' + index)
        global.renderLog.info('Playables size: ' + playables.length)
        if (playables.length == 0) {
          global.renderLog.info('no playables')
          return callback(false)
        }
        if (playables[index] == undefined) {
          return callback(false)
        }
        var server = playables[index].server
        var ratingKey = playables[index].result.ratingKey
        try {

        } catch (err) {
          global.renderLog.info('out of playables')
          return callback(false)
        }
        plex.chosenClient.pressStop(function(result) {
          global.renderLog.info('trying to play ' + ratingKey + ' from ' + server.name)
            // Subscribe to the client now, as some clients won't play media unless you're subscribed
          plex.chosenClient.subscribe(function(result) {
            global.renderLog.info('Subscribe result: ' + result)
            if (!result) {
              // Failed to subscribe, but lets try anyway
            }
            plex.chosenClient.playMedia(ratingKey, server,
              function(playResult, code, that) {
                global.renderLog.info('Play result below')
                global.renderLog.info(playResult)
                global.renderLog.info(code)
                if (code == '200' || code == 200) {
                  global.renderLog.info('Play success because of code')
                  checkBufferTime()
                  fireNotification('Plex Together AutoPlay', 'Now playing ' + hostData.title + ' from ' + server.name)
                  return callback(true)
                }
                if (playResult == undefined || playResult == null) {
                  global.renderLog.info('Play failed bcause of playResult')
                  setTimeout(function() {
                    playPlayables(index + 1)
                  }, 3000)
                  return callback(true)
                }
                if (playResult.response) {
                  if (playResult.response['$'].code == '200') {
                    checkBufferTime()
                    fireNotification('Plex Together AutoPlay', 'Now playing ' + hostData.title + ' from ' + server.name)
                    return callback(true)
                  }
                }
                if (playResult.Response) {
                  if (playResult.Response['$'].code == '200') {
                    checkBufferTime()
                    fireNotification('Plex Together AutoPlay', 'Now playing ' + hostData.title + ' from ' + server.name)
                    return callback(true)
                  }
                }
              })
          })
        })
      }
    }
  }
}

function checkBufferTime() {
  // This function is used to estimate how long it takes to buffer content when a seek occurs 
  // Broken at the moment
  var plex = remote.getGlobal('plex')

  plex.chosenClient.bufferTime = (0)
  return
  var i = 0
  var firstTime = 0
  var checkInterval = 200
  if (plex.chosenClient.platform == 'iOS') {
    // iOS REALLY doesn't like multiple quick commands
    checkInterval = 500
  }
  var checkBuffer = setInterval(function() {
    global.renderLog.info('check buffer tick')
    plex.chosenClient.getTimeline(function(timelines, responseTime) {
      if (!timelines) {
        return
      }
      if (i == 0) {
        firstTime = plex.chosenClient.lastTimelineObject.time
        i = i + 1
        return
      } else {
        i = i + 1
          // Check if the player is actually playing content now
        console.log('Iteration: ' + i + ') Player is at ' + plex.chosenClient.lastTimelineObject.time + ' but our first time is ' + firstTime)
        if (plex.chosenClient.lastTimelineObject.time != firstTime) {
          // We're now playing something!
          plex.chosenClient.bufferTime = (i * checkInterval)
          global.renderLog.info('Calculated buffer time to be roughly ' + plex.chosenClient.bufferTime + 'ms')
          clearInterval(checkBuffer)
          return
        } else {
          global.renderLog.info('Buffer iteration at ' + i)
        }
      }


    })
  }, checkInterval)
}

function updateSelfUserUsername(name) {
  var theUser = document.querySelectorAll('.mainUser')
  theUser[0].querySelectorAll('.ptuser-username')[0].innerHTML = name + '<span style="opacity:.50"> (you)</span>'
  document.getElementsByClassName('mainUser')[0].setAttribute('username', name)
}

function updatePTUser(userData) {
  //Find the users element and update it to the new details
  var percent = getPercent(userData.time, userData.maxTime)
  var allUsers = document.querySelectorAll('.ptuser')
    //global.renderLog.info(allUsers)
  var vettedData = cleanseUserData(userData)
  for (var i in allUsers) {
    var theUser = allUsers[i]
    try {
      theUser.getAttribute('username')
    } catch (error) {
      break
    }
    if (theUser.getAttribute('username') == userData.username) {
      //This is the user we need to update
      //Update Title
      theUser.querySelectorAll('.ptuser-username')[0].innerHTML = vettedData.username
      theUser.querySelectorAll('.ptuser-title')[0].innerHTML = vettedData.title
      theUser.querySelectorAll('.ptuser-time')[0].innerHTML = vettedData.time + ' / ' + vettedData.maxTime
      theUser.querySelectorAll('.ptuser-percent')[0].style.width = percent + '%'
      if (vettedData.role == 'host') {
        theUser.querySelectorAll('.ptuser-role')[0].style.display = 'unset'
      } else {
        theUser.querySelectorAll('.ptuser-role')[0].style.display = 'none'
      }
      //theUser.childNodes.getElementById('ptuser-title').innerHTML = userData.title
    }
  }

}

function addPTUserStart(userData) {
  global.renderLog.info('Adding a user')
  ipcRenderer.send('ptuser-thumb-download', userData)
}

function addPTUserFinish(userData, imgpath) {
  //A new user has connected, lets add them to the bottom
  var percent = getPercent(userData.time, userData.maxTime)
  var vettedData = cleanseUserData(userData)
  var role
  if (userData.role == 'host') {
    role = 'block'
  } else {
    role = 'none'
  }
  var htmlToAdd = '<li class="collection-item avatar ptuser"  username="' + vettedData.username + '" style="padding-bottom:0">\
                        <img src="' + imgpath + '" alt="" class="circle ptuser-avatar" style="box-shadow: 0 0 0 2px #E5A00D">\
                        <span class="title ptuser-username">' + vettedData.username + '</span>\
                        <p>\
                        <div class="ptuser-title">' + vettedData.title + '</div>\
                        <div class="row" style="margin-bottom:0">\
                            <div class="col s10">\
                                <div class="progress">\
                                    <div class="determinate ptuser-percent" style="width: ' + percent + '%"></div>\
                                </div>\
                            </div>\
                            <div class="col s2 ptuser-time" style="color: #E5A00D; margin-left:-138px; margin-top:-12px">\
                                ' + vettedData.time + ' / ' + vettedData.maxTime + '\
                            </div>\
                        </div>\
                        </p>\
                        <a href="#!" class="secondary-content ptuser-role" style="margin-top:9pxdisplay:' + role + '"><i class="material-icons" style="color: #E5A00D; font-size: 35px ">star</i></a>\
                    </li>'
  var userList = document.getElementsByClassName('page-userlist')[0]
  userList.innerHTML = userList.innerHTML + htmlToAdd
  var arrowDirection = 'arrow_drop_down'
  $('.metaDropdown').click(function() {
    if (arrowDirection == 'arrow_drop_down') {
      $(this).parent().find('#userMetadata').html('arrow_drop_down')
      $(this).html('arrow_drop_up')
      $('#userMetadata').css('display', 'block')
      $('#mainUser').css('box-shadow', '0 2px 5px 0 rgba(0, 0, 0, 0.16)')
      arrowDirection = 'arrow_drop_up'
    } else {
      $(this).parent().find('#userMetadata').html('arrow_drop_up')
      $(this).html('arrow_drop_down')
      $('#userMetadata').css('display', 'none')
      $('#mainUser').css('box-shadow', '0 2px 5px 0 rgba(0, 0, 0, 0)')
      arrowDirection = 'arrow_drop_down'
    }

  })

}

function removePTUser(username) {
  //A user has disconnect, lets remove their element in the list
  global.renderLog.info('removing ' + username)
  var allUsers = document.querySelectorAll('.ptuser')
  for (var i in allUsers) {
    var theUser = allUsers[i]
    try {
      theUser.getAttribute('username')
    } catch (error) {
      break
    }
    if (theUser.getAttribute('username') == username) {
      //This is the user we need to delete
      /*
      var startPx = 0
      var fadeOutUser = setInterval(function(){
          //We need to go from 1120px to the left to 0px
          if (startPx > 1119.99){
              //Done!
              theUser.remove()
              clearInterval(fadeOutUser)
              return
          }
          //Still not done, lets keep going
          startPx = startPx + 11.2
          theUser.style.left = startPx + 'px'
      },1.5)*/
      theUser.remove()
      return
    }
  }
}

function cleanseUserData(data) {
  var doneData = data
    //Username handling
  if (data.username == null) {
    //This should never happen
    doneData.username = 'Unknown User'
  }
  //Timestamp handling
  if (data.time == null || data.time == -1) {
    doneData.time = '00:00:00'
  } else {
    doneData.time = getTimeFromMs(data.time)
  }
  //MaxTime handling
  if (data.maxTime == null || data.maxTime == -1) {
    doneData.maxTime = '00:00:00'
  } else {
    doneData.maxTime = getTimeFromMs(data.maxTime)
  }
  //Title handling
  if (data.title == null) {
    doneData.title = 'Nothing'
  }
  //PlayerState handling
  if (data.playerState == null) {
    doneData.playerState = ''
  }
  doneData.rawTitle = data.rawTitle
  return doneData

}

function getPercent(current, max) {
  var percent = (current / max) * 100
  if (isNaN(percent)) {
    percent = 0
  }
  return percent
}

function PlexClientPlayPause() {
  var plex = remote.getGlobal('plex')
  if (plex.chosenClient.lastTimelineObject.state == 'paused') {
    plex.chosenClient.pressPlay(function() {})
  }
  if (plex.chosenClient.lastTimelineObject.state == 'playing') {
    plex.chosenClient.pressPause(function() {})
  }
}

function PlexClientStepBack() {
  var plex = remote.getGlobal('plex')
  plex.chosenClient.stepBack(function() {})
}

function PlexClientStepForward() {
  var plex = remote.getGlobal('plex')
  plex.chosenClient.stepForward(function() {})
}

function getTimeFromMs(ms) {
  var hours = ms / (1000 * 60 * 60)
  var absoluteHours = Math.floor(hours)
  var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours
  var minutes = (hours - absoluteHours) * 60
  var absoluteMinutes = Math.floor(minutes)
  var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes
  var seconds = (minutes - absoluteMinutes) * 60
  var absoluteSeconds = Math.floor(seconds)
  var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds
  return (h + ':' + m + ':' + s)
}
ipcRenderer.on('pt-addPTUser', function(event, user) {
  addPTUserStart(user)
})

ipcRenderer.on('pt-updatePTUser', function(event, user) {
  updatePTUser(user)
})
ipcRenderer.on('pt-removePTUser', function(event, user) {
  global.renderLog.info('user left')
  removePTUser(user.username)
})
ipcRenderer.on('pt-updateSelfUsername', function(event, username) {
  updateSelfUserUsername(username)
})
ipcRenderer.on('pt-handleHostUpdate', function(event, hostData) {
  handleHostUpdate(hostData)
})
ipcRenderer.on('pt-clearTickers', function(event) {
  for (var i in plexClientTickers) {
    clearInterval(plexClientTickers[i])
  }
  for (var i in ptServerTickers) {
    clearInterval(ptServerTickers[i])
  }
})
ipcRenderer.on('pt-server-address-change', function(event, address) {
  document.getElementById('plexTogetherServerAddress').innerHTML = address
})
ipcRenderer.on('pt-server-room-change', function(event, room, password) {
  document.getElementById('plexTogetherRoomName').innerHTML = room
  if (password == '' || password == null || password == undefined) {
    password = 'No password'
  }
  document.getElementById('plexTogetherRoomPassword').innerHTML = password
})
ipcRenderer.on('pt-server-showInfo', function(event) {
  ptserverShowInfo()
})
ipcRenderer.on('pt-server-hideInfo', function(event) {
  ptserverHideInfo()
})

function ptserverShowInfo() {
  document.getElementById('plexTogetherInfoButton').style.display = 'none'
  document.getElementById('plexTogetherInfo').style.display = 'block'
  $('.plexServerClientInfo').css({
    "height": "calc(100% - 401px)"
  })
}

function ptserverHideInfo() {
  document.getElementById('plexTogetherInfo').style.display = 'none'
  document.getElementById('plexTogetherInfoButton').style.display = 'block'
  $('.plexServerClientInfo').css({
    "height": "615px"
  })
}
ipcRenderer.on('pt-server-disconnect', function(event) {
  // Remove all current users
  handleDisconnect()
})

function handleDisconnect() {
  global.renderLog.info('disconnect time!')
  for (let j = 0; j < plexClientTickers.length; j++) {
    clearInterval(plexClientTickers[j])
  }
  let socket = remote.getGlobal('socket')
  if (socket != null && socket != undefined && socket.connected) {
    ipcRenderer.send('disconnect-socket')
  }
  let allusers = document.querySelectorAll('.ptuser')
  for (var i = 0; i < allusers.length; i++) {
    global.renderLog.info(allusers[i].getAttribute('mainuser'))
    if (allusers[i].getAttribute('mainuser') === 'true') {
      // This is us! Skip
      continue
    } else {
      global.renderLog.info('removing a user')
      removePTUser(allusers[i].getAttribute('username'))
    }
  }
  ptserverHideInfo()
  return false
}

//Notification handling
ipcRenderer.on('fire-notification', function(event, title, message, time) {
  fireNotification(title, message, time)
})

function fireNotification(title, message, time) {
  global.renderLog.info('sending notification: ' + title + ' - ' + message)
    //Fires a toast notification with a message and time
  var titleHTML = '<div style="text-align:center;clear:both">' + title + '</div>'
  var messageHTML = '<div style="text-align:center;font-size:12px;opacity:0.7;clear:both">' + message + '</div>'
  if (time == null || time == undefined) {
    time = 2500
  }
  Materialize.toast('<div class="row" style="margin-bottom:0px"><div class="col s12" style="text-align: center"> ' + titleHTML + messageHTML + '</div></div>', time)
}