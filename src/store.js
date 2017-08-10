import Vue from 'vue'
import Vuex from 'vuex'

import moment from '../node_modules/moment/moment.js'

const EventEmitter = require('events')
var request = require('request')
var socketio = require('socket.io-client')

Vue.use(Vuex)

// Persistant settings handling
function getSetting (key) {
  return window['localStorage'].getItem(key)
}

function setSetting (key, value) {
  return window['localStorage'].setItem(key, value)
}

function sendNotification (message) {
  return window.EventBus.$emit('notification', message)
}

if (!getSetting('INIT')) {
  // Initially setup our settings
  console.log('Settings init')
  setSetting('CLIENTPOLLINTERVAL', 1000)
  setSetting('DARKMODE', false)
  setSetting('SYNCMODE', 'cleanseek')
  setSetting('SYNCFLEXABILITY', 3000)
  setSetting('CUSTOMSERVER', 'http://')
  setSetting('INIT', true)
}
// Set up out web app socket for fetching short urls
let _webapp_socket = null
if (process.env.NODE_ENV == 'development') {
  console.log('running in development')

  _webapp_socket = socketio.connect('' + window.location.hostname + ':8088', {
    'forceNew': true,
    'connect timeout': 1000,
    path: '/ptweb/socket.io'
  })
  _webapp_socket.on('connection', function () {
  })
  _webapp_socket.on('connect_error', function () {
  })

} else {
  _webapp_socket = socketio.connect({
    'forceNew': true,
    'connect timeout': 1000, path: '/ptweb/socket.io'
  })
  _webapp_socket.on('connection', function () {
  })
  _webapp_socket.on('connect_error', function () {
  })
}

const state = {
  count: 0,
  appTitle: 'PlexTogether',
  appVersion: '1.3.2',
  background: null,
  shownChat: false,
  plex: null,
  chosenClient: null,
  chosenClientTimeSet: (new Date).getTime(),
  plexuser: JSON.parse(window['localStorage'].getItem('plexuser')),
  blockAutoPlay: false,
  autoJoin: false,
  autoJoinUrl: null,
  autoJoinRoom: null,
  autoJoinPassword: null,
  shortLink: null,
  webapp_socket: _webapp_socket,
  // SETTINGS
  DARKMODE: JSON.parse(getSetting('DARKMODE')),
  CLIENTPOLLINTERVAL: getSetting('CLIENTPOLLINTERVAL'),
  SYNCMODE: getSetting('SYNCMODE'),
  SYNCFLEXABILITY: getSetting('SYNCFLEXABILITY'),
  CUSTOMSERVER: getSetting('CUSTOMSERVER'),
  BLOCKEDSERVERS: JSON.parse(window['localStorage'].getItem('BLOCKEDSERVERS')),
  HOMEINIT: getSetting('HOMEINIT'),
  PTPLAYERQUALITY: getSetting('PTPLAYERQUALITY'),
  PTPLAYERVOLUME: getSetting('PTPLAYERVOLUME'),
  LASTSERVER: getSetting('LASTSERVER'),
  stats: {}
}

const mutations = {
  SET_CHOSENCLIENT (state, client) {
    function playbackChange (ratingKey) {
      console.log('Playback change!')
      if (ratingKey != null) {
        // Playing something different!
        let server = state.plex.getServerById(state.chosenClient.lastTimelineObject.machineIdentifier)
        state.LASTSERVER = state.chosenClient.lastTimelineObject.machineIdentifier        
        window['localStorage'].setItem('LASTSERVER',state.chosenClient.lastTimelineObject.machineIdentifier)
        if (!server) {
          return
        }
        // Fetch our metadata from this server
        console.log('Loading content metadata from store ' + ratingKey)
        server.getMediaByRatingKey(ratingKey.replace('/library/metadata/', ''), function (metadata) {
          if (!metadata) {
            return
          }
          if (metadata.type == 'movie') {
            sendNotification('Now Playing: ' + metadata.title + ' from ' + state.plex.getServerById(metadata.machineIdentifier).name)
          }
          if (metadata.type == 'episode') {
            sendNotification('Now Playing: ' + metadata.grandparentTitle + ' S' + metadata.parentIndex + 'E' + metadata.index + ' from ' + state.plex.getServerById(metadata.machineIdentifier).name)
          }
          state.chosenClient.clientPlayingMetadata = metadata
          var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
          var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
          state.background =  state.plex.getServerById(metadata.machineIdentifier).getUrlForLibraryLoc(metadata.thumb, w / 4, h / 4, 4)
        })
      } else {
        state.plex.getRandomThumb((res) => {
          if (res){
            state.background = res
          }
        })
        state.chosenClient.clientPlayingMetadata = null
      }
    }

    function newTimeline (timeline) {
      //console.log('Got timeline')
      if (!state.plextogether.connected) {
        return
      }
      // Lets send this to our PTServer
      state.ourClientResponseTime = timeline.lastResponseTime
      let title = null
      let rawTitle = null
      if (state.chosenClient.clientPlayingMetadata) {
        let metadata = state.chosenClient.clientPlayingMetadata
        rawTitle = metadata.title
        if (metadata.type == 'episode') {
          title = metadata.grandparentTitle + ' - ' + metadata.title + ' S' + metadata.parentIndex + '-' + 'E' + metadata.index
        } else {
          title = metadata.title
        }
      }
      let end_obj = {
        time: timeline.time,
        maxTime: timeline.duration,
        title: title,
        rawTitle: rawTitle,
        playerState: timeline.state,
        clientResponseTime: state.chosenClient.lastResponseTime
      }
      let time = -1
      let maxTime = -1
      let playerState = null
      let showName = null

      state.plextogether._socket.pollStartTime = (new Date).getTime()
      state.plextogether._socket.emit('poll', end_obj)
    }

    // Set up our client poller
    function clientPoller (time) {
      if (state.chosenClient == null) {
        return
      }
      if (state.chosenClientTimeSet != time) {
        // We have a new chosen client, we need to stop
        return
      }
      state.chosenClient.getTimeline(function (timeline) {
        //console.log(timeline)
      })
      setTimeout(function () {
        clientPoller(time)
      }, state.CLIENTPOLLINTERVAL)
    }

    // Check if we need to remove old handlers
    if (state.chosenClient) {
      state.chosenClient.events.removeAllListeners()
    }
    state.chosenClient = client
    if (state.chosenClient && state.chosenClient.lastTimelineObject) {
      state.chosenClient.lastTimelineObject.ratingKey = -1
    }
    if (state.chosenClient == null) {
      return
    }
    state.chosenClient.events.on('new_timeline', newTimeline)
    state.chosenClient.events.on('playback_change', playbackChange)
    state.chosenClientTimeSet = (new Date).getTime()
    clientPoller(state.chosenClientTimeSet)
    state.chosenClient.getTimeline(function (timeline) {})

  },
  SET_PLEX (state, value) {
    state.plex = value
  },
  SET_AUTOJOIN (state, value) {
    state.autoJoin = value
  },
  SET_BACKGROUND (state, value) {
    state.background = value
  },
  SET_AUTOJOINROOM (state, value) {
    state.autoJoinRoom = value
  },
  SET_AUTOJOINPASSWORD (state, value) {
    state.autoJoinPassword = value
  },
  SET_AUTOJOINURL (state, value) {
    state.autoJoinUrl = value
  },
  SET_SHORTLINK (state, value) {
    state.shortLink = value
  },
  setSetting (state, data) {
    let orignal = state.settings
    state.settings[data.key] = data.value
    window['localStorage'].setItem('PTSETTINGS', JSON.stringify(state.settings))
  },
  setSettingCLIENTPOLLINTERVAL (state, data) {
    setSetting('CLIENTPOLLINTERVAL', data)
    state.CLIENTPOLLINTERVAL = data
  },
  setSettingSYNCMODE (state, data) {
    setSetting('SYNCMODE', data)
    state.SYNCMODE = data
  },
  setSettingSYNCFLEXABILITY (state, data) {
    setSetting('SYNCFLEXABILITY', data)
    state.SYNCFLEXABILITY = data
  },
  setSettingCUSTOMSERVER (state, data) {
    setSetting('CUSTOMSERVER', data)
    state.CUSTOMSERVER = data
  },
  setSettingDARKMODE (state, data) {
    setSetting('DARKMODE', data)
    state.DARKMODE = data
  },
  setSettingBLOCKEDSERVERS (state, data) {
    window['localStorage'].setItem('BLOCKEDSERVERS', JSON.stringify(data))
    state.BLOCKEDSERVERS = data
  },
  setSettingPTPLAYERQUALITY (state, data){
    window['localStorage'].setItem('PTPLAYERQUALITY',JSON.stringify(data))
    state.PTPLAYERQUALITY = data
  },  
  setSettingPTPLAYERVOLUME (state, data){
    window['localStorage'].setItem('PTPLAYERVOLUME',JSON.stringify(data))
    state.PTPLAYERVOLUME = data
  },  
  setSettingLASTSERVER (state, data){
    window['localStorage'].setItem('LASTSERVER',data)
    state.LASTSERVER = data
  },
  setSettingHOMEINIT (state, data) {
    setSetting('HOMEINIT', data)
    state.HOMEINIT = data
  },
  SET_CHAT (state, value) {
    state.shownChat = value
  },
  SET_BLOCKAUTOPLAY (state, value) {
    state.blockAutoPlay = value
  },
  SET_DECISIONBLOCKED (state, value) {
    state.decisionBlocked = value
  },
  REFRESH_PLEXDEVICES (state) {
    store.state.plex.getDevices(function () {

    })
  },
  SET_RANDOMBACKROUND (state) {
    state.plex.getRandomThumb((result) => {
      if (result){
        state.background = result
      }
    })
  },

  // Settings
  SET_OURCLIENTRESPONSETIME (state, value) {
    state.stats.ourClientResponseTime
  },
  SET_OURPTSERVERRESPONSETIME (state, value) {
    state.stats.ourPTServerResponseTime = value
  },
  SET_HOSTCLIENTRESPONSETIME (state, value) {
    state.stats.hostClientResponseTime = value
  },
  SET_HOSTPTSERVERRESPONSETIME (state, value) {
    state.stats.hostPTServerResponseTime = value
  }
}
const getters = {
  getPlex: state => {
    return state.plex
  },
  getPlexUser: state => {
    return state.plexuser
  },
  getBackground: state => {
    return state.background
  },
  getChosenClient: state => {
    return state.chosenClient
  },
  getShownChat: state => {
    return state.shownChat
  },
  getStats: state => {
    return state.stats
  },
  getBlockAutoPlay: state => {
    return state.blockAutoPlay
  },
  getAutoJoin: state => {
    return state.autoJoin
  },
  getAutoJoinRoom: state => {
    return state.autoJoinRoom
  },
  getAutoJoinPassword: state => {
    return state.autoJoinPassword
  },
  getAutoJoinUrl: state => {
    return state.autoJoinUrl
  },
  getShortLink: state => {
    return state.shortLink
  },

  // SETTINGS
  getSettingCLIENTPOLLINTERVAL: state => {
    return state.CLIENTPOLLINTERVAL
  },
  getSettingSYNCMODE: state => {
    return state.SYNCMODE
  },
  getSettingSYNCFLEXABILITY: state => {
    return state.SYNCFLEXABILITY
  },
  getSettingCUSTOMSERVER: state => {
    return state.CUSTOMSERVER
  },
  getSettingDARKMODE: state => {
    return state.DARKMODE
  },
  getSettingBLOCKEDSERVERS: state => {
    return state.BLOCKEDSERVERS
  },
  getSettingHOMEINIT: state => {
    return state.HOMEINIT
  },
  getSettingPTPLAYERQUALITY: state => {
    return state.PTPLAYERQUALITY
  },  
  getSettingPTPLAYERVOLUME: state => {
    return state.PTPLAYERVOLUME
  },
  getSettingLASTSERVER: state => {
    return state.LASTSERVER
  }
}
const actions = {
  incrementAsync ({commit}) {
    setTimeout(() => {
      commit('INCREMENT')
    }, 200)
  },


}
const plexTogether = {
  state: {
    _io: require('socket.io-client'),
    _socket: null,
    ptevents: new EventEmitter(),
    ptservers: [],
    connected: false,
    server: false,
    room: false,
    password: false,
    users: [],
    messages: [],
    me: '',
    decisionBlocked: false
  },
  getters: {
    getServer: state => {
      return state.server
    },
    getMe: state => {
      return state.me
    },
    getRoom: state => {
      return state.room
    },
    getPassword: state => {
      return state.password
    },
    getUsers: state => {
      return state.users
    },
    getConnected: state => {
      return state.connected
    },
    getMessages: state => {
      return state.messages
    },
    getSocket: state => {
      return state._socket
    }
  },
  mutations: {
    SET_CONNECTED (state, value) {
      state.connected = value
    },
    SET_ME (state, value) {
      state.me = value
    },
    SET_USERS (state, value) {
      state.users = value
    },
    SET_ROOM (state, value) {
      state.room = value
    },
    SET_PASSWORD (state, value) {
      state.password = value
    },
    SET_SERVERS (state, value) {
      state.servers = value
    },
    SET_SERVER (state, value) {
      state.server = value
    },
    ADD_MESSAGE (state, msg) {
      msg.time = moment().format('h:mm A')
      state.messages.push(msg)
    },
    CLEAR_MESSAGES (state, msg) {
      state.messages = []
    }
  },

  actions: {
    autoJoin ({state, commit, rootState, dispatch}, data) {
      console.log('Attempting to auto join..')
      console.log(rootState)
      dispatch('socketConnect', {
        address: rootState.autoJoinUrl,
        callback: function (data) {
          console.log('Socket connection result below')
          console.log(data)
          if (!data.result) {
            console.log('Failed to connect')
          } else {
            let temporaryObj = {
              user: rootState.plex.user,
              roomName: rootState.autoJoinRoom,
              password: rootState.autoJoinPassword,
              callback: function (result) {
                console.log(result)
              }
            }
            dispatch('joinRoom', temporaryObj)
          }
        }
      })
    },
    socketConnect ({state, commit, rootState}, data) {
      let address = data.address
      let callback = data.callback
      var that = this
      if (state._socket) {
        state._socket.disconnect()
      }
      console.log('Socket attempt connect on ' + address)
      state._socket = state._io.connect(address, {
        'forceNew': true,
        'connect timeout': 7000, path: '/ptserver/socket.io'
      })
      state._socket.on('connect', function (result) {
        // Good connection
        sendNotification('Connected to ' + address)
        callback({
          result: true,
          data: result
        })
        commit('SET_CONNECTED', true)
        commit('SET_SERVER', address)
        if (state.room) {
          // Looks like the server disconnected on us, lets rejoin
          console.log('Attempting to rejoin our room...')
          state._socket.emit('join', new getHandshakeUser(rootState.plex.user, state.room, state.password))
        }
        return
      })
      state._socket.on('connect_error', function (result) {
        // Bad connection
        console.log('Failed to connect')        
        callback({
          result: false,
          data: result
        })
        commit('SET_CONNECTED', false)
        commit('SET_SERVER', null)
        return
      })
    },
    joinRoom ({state, commit, rootState}, data) {
      var that = this
      if (!state._socket || !state.connected) {
        return data.callback(false)
      }
      commit('SET_PASSWORD', data.password)
      console.log('Attempting to join')
      console.log(data)
      state._socket.emit('join', new getHandshakeUser(data.user, data.roomName, data.password))
      state._socket.on('join-result', function (result, _data, details, currentUsers) {
        commit('CLEAR_MESSAGES')
        if (result) {
          commit('SET_ROOM', _data.room)
          commit('SET_USERS', currentUsers)
          commit('SET_ME', _data.username)
          commit('SET_CHAT', true)

          sendNotification('Joined room: ' + _data.room)

          // Generate our short url/invite link
          console.log('generating our invite link')
          console.log(state)
          let webapp_socket = rootState.webapp_socket
          let url = window.location.origin

          let urlOrigin = window.location.origin
          let data = {
            urlOrigin: urlOrigin,
            owner: rootState.plex.user.username,
            ptserver: state.server,
            ptroom: state.room,
            ptpassword: state.password

          }
          var that = this
          console.log('Invite link data below')
          console.log(data)
          webapp_socket.on('shorten-result', function (shortUrl) {
            console.log('Our short url is ' + shortUrl)
            commit('SET_SHORTLINK', shortUrl)
          })
          webapp_socket.emit('shorten', data)

          // Now we need to setup events for dealing with the PTServer.
          // We will regularly be recieving and sending data to and from the server.
          // We want to make sure we are listening for all the server events
          state._socket.on('poll-result', function (users) {
            commit('SET_OURCLIENTRESPONSETIME', Math.abs((new Date().getTime()) - state._socket.pollStartTime))
            commit('SET_USERS', users)
          })
          state._socket.on('user-joined', function (users, user) {
            commit('SET_USERS', users)
            commit('ADD_MESSAGE', {
              msg: user.username + ' joined',
              user: user,
              type: 'alert'
            })
            console.log(users)
          })
          state._socket.on('user-left', function (users, user) {
            commit('SET_USERS', users)
            commit('ADD_MESSAGE', {
              msg: user.username + ' left the room',
              user: user,
              type: 'alert'
            })
          })
          state._socket.on('host-swap', function (user) {
            if (!user) {
              return
            }
            commit('ADD_MESSAGE', {
              msg: user.username + ' is now the host',
              user: user,
              type: 'alert'
            })
          })
          state._socket.on('host-update', function (data) {
            /* This is data from the host, we should react to this data by potentially changing
              what we're playing or seeking to get back in sync with the host.

              We need to limit how ourself to make sure we dont hit the client too hard.
              We'll only fetch new data if our data is older than 1000ms.
              If we need to fetch new data, we'll do that and then decide
              if we need to seek or start playing something.
              */
            rootState.hostClientResponseTime = data.clientResponseTime
            if (state.decisionBlocked) {
              console.log('We are not going to make a decision from the host data because a command is already running')
              return
            }
            console.log('Decision isnt blocked')
            if (!rootState.chosenClient) {
              console.log('We dont have a client chosen yet!')
              return
            }
            if (!rootState.chosenClient.lastTimelineObject) {
              console.log('Dont have our first timeline data yet.')
              return
            }
            // Check previous timeline data age
            let timelineAge = new Date().getTime() - rootState.chosenClient.lastTimelineObject.recievedAt
            if (timelineAge > 1000) {
              rootState.chosenClient.getTimeline(function (newtimeline) {
                decisionMaker(0)
                return
              })
            } else {
              decisionMaker(timelineAge)
              return
            }

            function decisionMaker (timelineAge) {
              let ourTimeline = rootState.chosenClient.lastTimelineObject
              let hostTimeline = data

              if (ourTimeline.playerState == 'buffering') {
                return
              }
              if ((hostTimeline.playerState == 'stopped' || !hostTimeline.playerState) && ourTimeline.state != 'stopped') {
                console.log('Pressing stop because the host did')
                sendNotification('The host pressed stop')
                rootState.chosenClient.pressStop(() => {
                  state.decisionBlocked = false
                })
                return
              }

              if (hostTimeline.playerState == 'stopped') {
                return
              }
              // Check if we need to autoplay
              if ((ourTimeline.state == 'stopped' || !ourTimeline.state) && (hostTimeline.playerState != 'stopped')) {
                if (rootState.blockAutoPlay || !hostTimeline.rawTitle) {
                  return
                }
                // We need to autoplay!
                rootState.blockAutoPlay = true
                state.decisionBlocked = true

                let blockedServers = rootState.BLOCKEDSERVERS
                let validServers = rootState.plex.servers.length
                if (blockedServers){
                  for (let i = 0; i < blockedServers.length; i++ ){
                    if (rootState.plex.getServerById(blockedServers[i])){
                      validServers--
                    }
                  }
                }

                sendNotification('Searching ' + validServers + ' Plex Servers for "' + hostTimeline.rawTitle + '"')
                rootState.plex.playContentAutomatically(rootState.chosenClient, hostTimeline, blockedServers, hostTimeline.time, function (result) {
                  console.log('Auto play result: ' + result)
                  if (!result) {
                    sendNotification('Failed to find a compatible copy of ' + hostTimeline.rawTitle)
                  }
                  state.decisionBlocked = false
                  setTimeout(function () {
                    rootState.blockAutoPlay = false
                  }, 15000)
                })
                return
              }
              let difference = Math.abs((parseInt(ourTimeline.time) + parseInt(timelineAge)) - parseInt(hostTimeline.time))

              if (hostTimeline.playerState == 'playing' && ourTimeline.state == 'paused') {
                sendNotification('The host pressed play')
                rootState.chosenClient.pressPlay(function () {
                  checkForSeek()
                })
                return
              }
              if (hostTimeline.playerState == 'paused' && ourTimeline.state == 'playing') {
                sendNotification('The host pressed pause')
                rootState.chosenClient.pressPause(function () {
                  checkForSeek()
                })
                return
              }
              checkForSeek()

              function checkForSeek () {
                if (parseInt(difference) > parseInt(rootState.SYNCFLEXABILITY)) {
                  // We need to seek!
                  console.log('STORE: we need to seek')
                  // Decide what seeking method we want to use
                  if (rootState.SYNCMODE == 'cleanseek') {
                    cleanSeek()
                    return
                  }
                  if (rootState.SYNCMODE == 'skipahead') {
                    skipAhead()
                    return
                  }
                  // Fall back to skipahead
                  skipAhead()
                  return

                  function skipAhead () {
                    let server = rootState.plex.getServerById(ourTimeline.machineIdentifier)
                    let extra = 500
                    if (parseInt(hostTimeline.time) < parseInt(ourTimeline.time) && difference < 15000) {
                      state.decisionBlocked = true
                      let sleepFor = (parseInt(difference))

                      // If the host is 'playing' we should seek ahead, pause for the difference and then resume
                      // If the host is 'paused' we should just seek to their position

                      if (hostTimeline.playerState == 'paused') {
                        rootState.chosenClient.seekTo(parseInt(hostTimeline.time), function () {
                          state.decisionBlocked = false
                        })
                        return
                      } else {
                        setTimeout(function () {
                          rootState.chosenClient.pressPlay(function (result, responseTime) {
                            state.decisionBlocked = false
                          })
                        }, difference)
                      }
                      rootState.chosenClient.pressPause(function (result, responseTime) {
                      })
                    } else {
                      state.decisionBlocked = true
                      rootState.chosenClient.seekTo(parseInt(hostTimeline.time) + 10000, function () {
                        state.decisionBlocked = false
                      })
                    }
                    return
                  }

                  function cleanSeek () {
                    state.decisionBlocked = true
                    rootState.chosenClient.seekTo(parseInt(hostTimeline.time), function (result) {
                      console.log('Result from within store for seek was ' + result)
                      console.log('Setting decision blocked to false ')
                      state.decisionBlocked = false
                    })
                  }
                }
              }
            }
          })
          state._socket.on('disconnect', function (data) {
            sendNotification('Disconnected from the PlexTogether server')
            if (data == 'io client disconnect') {
              console.log('We disconnected from the server')
              commit('SET_ROOM', null)
              commit('SET_PASSWORD', null)
              commit('SET_USERS', [])
              commit('SET_CONNECTED', false)
              commit('SET_SERVER', null)
              commit('SET_CHAT', false)
              state.serverError = null
            }
            if (data == 'transport close') {
              console.log('The server disconnected on us')
            }
          })
          state._socket.on('new_message', function (msgObj) {
            commit('ADD_MESSAGE', msgObj)
          })

        } else {
          commit('SET_ME', null)
          commit('SET_ROOM', null)
          commit('SET_PASSWORD', null)
          commit('SET_USERS', [])
          commit('SET_CHAT', false)
        }
        return data.callback(result)
      })
    },
    disconnectServer ({state, commit, rootState}) {
      state._socket.disconnect()
      commit('SET_ROOM', null)
      commit('SET_PASSWORD', null)
      commit('SET_USERS', [])
      commit('SET_CONNECTED', false)
      commit('SET_SERVER', null)
      commit('SET_CHAT', false)
    },
    sendNewMessage ({state, commit, rootState}, msg) {
      commit('ADD_MESSAGE', {
        msg: msg,
        user: {
          username: 'You',
          thumb: rootState.plex.user.thumb
        },
        type: 'message'
      })
      if (state._socket.connected) {
        state._socket.emit('send_message', {
          msg: msg,
          type: 'message'
        })
      }
    },
    getServerList () {
    },
  }
}

function getHandshakeUser (user, room, password) {
  var tempUser = {
    'username': user.username,
    'room': room,
    'password': password,
    'avatarUrl': user.thumb
  }
  return tempUser
}

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules: {
    plextogether: plexTogether
  }
})

export default store
