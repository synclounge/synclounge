import Vue from 'vue'
import Vuex from 'vuex'

import moment from '../node_modules/moment/moment.js'


const EventEmitter = require('events');
var request = require('request')



Vue.use(Vuex)

// Persistant settings handling
function getSetting(key) {
  return window['localStorage'].getItem(key)
}
function setSetting(key,value) {
  return window['localStorage'].setItem(key,value)
}

if(!getSetting('INIT')){
  // Initially setup our settings
  console.log('Settings init')
  setSetting('CLIENTPOLLINTERVAL',1000)
  setSetting('DARKMODE',false)
  setSetting('SYNCMODE','cleanseek')
  setSetting('SYNCFLEXABILITY',4000)  
  setSetting('CUSTOMSERVER','http://')
  setSetting('INIT',true)
}


const state = {
  count: 0,
  appTitle: 'PlexTogether',
  appVersion: '1.0.0',
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
  // SETTINGS
  DARKMODE: JSON.parse(getSetting('DARKMODE')),
  CLIENTPOLLINTERVAL: getSetting('CLIENTPOLLINTERVAL'),
  SYNCMODE: getSetting('SYNCMODE'),
  SYNCFLEXABILITY: getSetting('SYNCFLEXABILITY'),
  CUSTOMSERVER: getSetting('CUSTOMSERVER'),
  stats: {}
}

const mutations = {
  SET_CHOSENCLIENT(state,client){    
    function playbackChange(ratingKey){
        if (ratingKey != null) { 
            // Playing something different!
            let server = state.plex.getServerById(state.chosenClient.lastTimelineObject.machineIdentifier)
            if (!server){
                return
            }
            // Fetch our metadata from this server
            server.getMediaByRatingKey(ratingKey,function(metadata){
                if (!metadata){
                    return
                }
                state.chosenClient.clientPlayingMetadata = metadata
            })
        } else {
            state.chosenClient.clientPlayingMetadata = null
        }
    }
    function newTimeline(timeline){   
      if (!state.plextogether.connected){
        return
      }
      // Lets send this to our PTServer
      state.ourClientResponseTime = timeline.lastResponseTime
      let title = null
      let rawTitle = null
      if (state.chosenClient.clientPlayingMetadata){
        let metadata = state.chosenClient.clientPlayingMetadata
        rawTitle = metadata.title
        if (metadata.type == 'episode'){
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
      state.plextogether._socket.emit('poll',end_obj)
    }
              
    // Set up our client poller 
    function clientPoller(time){
      if (state.chosenClient == null){
          return
      }
      if (state.chosenClientTimeSet != time){
        // We have a new chosen client, we need to stop 
        return 
      }
      state.chosenClient.getTimeline(function(timeline){
          //console.log(timeline)
      })
      setTimeout(function(){
        clientPoller(time)
      },state.CLIENTPOLLINTERVAL)
    }      

    // Check if we need to remove old handlers
    if (state.chosenClient){
      state.chosenClient.events.removeAllListeners(); 
    }
    state.chosenClient = client   
    if (state.chosenClient && state.chosenClient.lastTimelineObject){
      state.chosenClient.lastTimelineObject.ratingKey = -1
    }      
    if (state.chosenClient == null){
      return
    }
    state.chosenClient.events.on('new_timeline',newTimeline)         
    state.chosenClient.events.on('playback_change',playbackChange)  
    state.chosenClientTimeSet = (new Date).getTime()
    clientPoller(state.chosenClientTimeSet)
    state.chosenClient.getTimeline(function(timeline){})  
      

    
  },
  SET_PLEX(state,value){
    state.plex = value
  },  
  SET_AUTOJOIN(state,value){
    state.autoJoin = value
  },  
  SET_AUTOJOINROOM(state,value){
    state.autoJoinRoom = value
  },  
  SET_AUTOJOINPASSWORD(state,value){
    state.autoJoinPassword = value
  },  
  SET_AUTOJOINURL(state,value){
    state.autoJoinUrl = value
  },
  setSetting(state,data){
    let orignal = state.settings
    state.settings[data.key] = data.value
    window['localStorage'].setItem('PTSETTINGS',JSON.stringify(state.settings))
  },
  setSettingCLIENTPOLLINTERVAL(state,data){
    setSetting('CLIENTPOLLINTERVAL',data)
    state.CLIENTPOLLINTERVAL = data
  },
  setSettingSYNCMODE(state,data){
    setSetting('SYNCMODE',data)
    state.SYNCMODE = data
  },  
  setSettingSYNCFLEXABILITY(state,data){
    setSetting('SYNCFLEXABILITY',data)
    state.SYNCFLEXABILITY = data
  },  
  setSettingCUSTOMSERVER(state,data){
    setSetting('CUSTOMSERVER',data)
    state.CUSTOMSERVER = data
  },
  setSettingDARKMODE(state,data){
    setSetting('DARKMODE',data)
    state.DARKMODE = data
  },
  SET_CHAT(state,value){
    state.shownChat = value
  },
  SET_BLOCKAUTOPLAY(state,value){
    state.blockAutoPlay = value
  },  
  REFRESH_PLEXDEVICES(state){
    store.state.plex.getDevices(function(){
      
    })
  },


  // Settings
  SET_OURCLIENTRESPONSETIME(state,value){
    state.stats.ourClientResponseTime
  },
  SET_OURPTSERVERRESPONSETIME(state,value){
    state.stats.ourPTServerResponseTime = value
  },
  SET_HOSTCLIENTRESPONSETIME(state,value){
    state.stats.hostClientResponseTime = value
  },
  SET_HOSTPTSERVERRESPONSETIME(state,value){
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
}
const actions = {
  incrementAsync({commit}) {
    setTimeout(() => {
      commit('INCREMENT')
    }, 200)
  },
  openSettings({commit}) {
    $('#settingsModal').modal('open');
  },
  openStatistics({commit}) {
    $('#statisticsModal').modal('open');
  },

}
const plexTogether = {
  state: { 
    _io: require('socket.io-client'),     
    _socket:null,
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
    SET_CONNECTED(state, value) {
      state.connected = value
    },
    SET_ME(state, value){
      state.me = value
    },
    SET_USERS(state, value) {
      state.users = value
    },
    SET_ROOM(state, value) {
      state.room = value
    },
    SET_PASSWORD(state, value) {
      state.password = value
    },
    SET_SERVERS(state, value) {
      state.servers = value
    },
    SET_SERVER(state,value){
      state.server = value
    },
    ADD_MESSAGE(state,msg){
      msg.time = moment().format('h:mm A')
      state.messages.push(msg)  
    },
    CLEAR_MESSAGES(state,msg){
      state.messages = []
    }
   },

  actions: {     
    socketConnect({ state, commit, rootState },data) {
      let address = data.address
      let callback = data.callback
      var that = this
      if (state._socket){
        state._socket.disconnect()
      }
      console.log('Socket attempt connect on ' + address)
      state._socket = state._io.connect(address,{'forceNew':true,
      'connect timeout': 7000,path:'/pt/server/socket.io' })
      state._socket.on('connect',function(result){
          // Good connection
          callback({
            result:false,
            data:result
          })
          commit('SET_CONNECTED',true)
          commit('SET_SERVER',address)
          if (state.room){
            // Looks like the server disconnected on us, lets rejoin
            console.log('Attempting to rejoin our room...')
            state._socket.emit('join',new getHandshakeUser(rootState.plex.user,state.room,state.password))
          }
          return
      })
      state._socket.on('connect_error',function(result){
          // Bad connection
          console.log('Failed to connect')
          commit('SET_CONNECTED',false)
          commit('SET_SERVER',null)
          return
      })
    },
    joinRoom({ state, commit, rootState },data){
        var that = this
        if (!state._socket || !state.connected){
            return callback(false)
        }
        state._socket.emit('join',new getHandshakeUser(data.user,data.roomName,data.password))
        state._socket.on('join-result',function(result,_data,details,currentUsers){
          commit('CLEAR_MESSAGES')
          if (result){
            commit('SET_ROOM',_data.room)
            commit('SET_PASSWORD',_data.password)
            commit('SET_USERS',currentUsers)
            commit('SET_ME',data.username)
            commit('SET_CHAT',true)

            // Now we need to setup events for dealing with the PTServer.
            // We will regularly be recieving and sending data to and from the server.
            // We want to make sure we are listening for all the server events
            state._socket.on('poll-result',function(users){
              commit('SET_OURCLIENTRESPONSETIME', Math.abs((new Date().getTime()) - state._socket.pollStartTime))
              commit('SET_USERS',users)
            })              
            state._socket.on('user-joined',function(users,user){
              commit('SET_USERS',users)       
              commit('ADD_MESSAGE',{
                msg: user.username + ' joined',
                user: user,
                type: 'alert'
              })
              console.log(users)
            })              
            state._socket.on('user-left',function(users,user){
              commit('SET_USERS',users)
              commit('ADD_MESSAGE',{
                msg: user.username + ' left the room',
                user: user,
                type: 'alert'
              })
            })              
            state._socket.on('host-swap',function(user){
              if (!user){
                return
              }
              commit('ADD_MESSAGE',{
                msg: user.username + ' is now the host',
                user: user,
                type: 'alert'
              })
            })
            state._socket.on('host-update',function(data){
              /* This is data from the host, we should react to this data by potentially changing
                what we're playing or seeking to get back in sync with the host.

                We need to limit how ourself to make sure we dont hit the client too hard.
                We'll only fetch new data if our data is older than 1000ms.
                If we need to fetch new data, we'll do that and then decide 
                if we need to seek or start playing something. 
                */
              rootState.hostClientResponseTime = data.clientResponseTime
              if (state.decisionBlocked){
                console.log('We are not going to make a decision from the host data because a command is already running')
                return
              }
              if (!data.rawTitle){
                  // Host has probably stopped playing, lets ignore
                  console.log('Host isnt playing anything!')
                  return
              }
              if (!rootState.chosenClient){
                console.log('We dont have a client chosen yet!')
                return
              }
              if (!rootState.chosenClient.lastTimelineObject){
                console.log('Dont have our first timeline data yet.')
                return
              }
              // Check previous timeline data age 
              let timelineAge = new Date().getTime() - rootState.chosenClient.lastTimelineObject.recievedAt
              if (timelineAge > 1000){
                rootState.chosenClient.getTimeline(function(newtimeline){
                  decisionMaker(0)
                  return
                })
              } else {
                decisionMaker(timelineAge)
                return
              }


              function decisionMaker(timelineAge){
                let ourTimeline = rootState.chosenClient.lastTimelineObject
                let hostTimeline = data

                if (ourTimeline.playerState == 'buffering'){
                  return
                }
                if (hostTimeline.playerState == 'stopped'){
                  return
                }

                // Check if we need to autoplay
                if ((ourTimeline.state == 'stopped' || !ourTimeline.state) && (hostTimeline.playerState != 'stopped')){
                  if (rootState.blockAutoPlay){
                    return
                  }
                  // We need to autoplay!
                  rootState.blockAutoPlay = true
                  rootState.plex.playContentAutomatically(rootState.chosenClient,hostTimeline, function(result){
                    console.log('Auto play result: ' + result)
                    setTimeout(function(){
                      rootState.blockAutoPlay = false
                    },15000)
                  })
                  return
                }
                let difference = Math.abs((parseInt(ourTimeline.time) + parseInt(timelineAge)) - parseInt(hostTimeline.time))


                // If we are greater than 4 seconds from the host we want to seek to them
                // We also want to try and 'predict' where we are and where the host is 
                // taking in to condsideration the lag between 
                /* 
                -> Host to client
                -> Host to PTServer
                -> Us to client
                -> Us to PTserver 
                -> 500ms extra for the lag of Plex Clients



                */

                if (hostTimeline.playerState == 'playing' && ourTimeline.state == 'paused'){
                  rootState.chosenClient.pressPlay(function(){
                    checkForSeek()
                  })
                  return
                }
                if (hostTimeline.playerState == 'paused' && ourTimeline.state == 'playing'){
                  rootState.chosenClient.pressPause(function(){
                    checkForSeek()
                  })
                  return
                }
                checkForSeek()
                function checkForSeek(){
                  if (parseInt(difference) > parseInt(rootState.SYNCFLEXABILITY) ){
                    // We need to seek! 

                    // Decide what seeking method we want to use
                    if (rootState.SYNCMODE == 'cleanseek'){
                      cleanSeek()
                      return
                    }
                    if (rootState.SYNCMODE == 'skipahead'){
                      skipAhead()
                      return
                    }
                    // Fall back to skipahead
                    skipAhead()
                    return


                    function skipAhead(){
                      let server = rootState.plex.getServerById(ourTimeline.machineIdentifier)
                      let extra = 500
                      if (parseInt(hostTimeline.time) < parseInt(ourTimeline.time) && difference < 15000){
                        state.decisionBlocked = true
                        let sleepFor = (parseInt(difference))




                        // If the host is 'playing' we should seek ahead, pause for the difference and then resume
                        // If the host is 'paused' we should just seek to their position


                        if (hostTimeline.playerState == 'paused'){
                          rootState.chosenClient.seekTo(parseInt(hostTimeline.time),function(){
                            state.decisionBlocked = false
                          })
                          return
                        } else {
                          setTimeout(function(){
                              rootState.chosenClient.pressPlay(function(result,responseTime){
                                state.decisionBlocked = false
                              })
                            },difference)
                          }
                          rootState.chosenClient.pressPause(function(result,responseTime){
                          })
                          
                        
                        extra = parseInt(server.chosenConnection.responseTime) * 2 


                        
                      } else {
                        state.decisionBlocked = true
                        rootState.chosenClient.seekTo(parseInt(hostTimeline.time) + 10000,function(){
                          state.decisionBlocked = false
                        })
                      }
                    return
                  }
                  

                  function cleanSeek(){
                    state.decisionBlocked = true
                    rootState.chosenClient.seekTo(parseInt(hostTimeline.time),function(){
                      state.decisionBlocked = false
                    })
                  }
                }
              }
              }
            })
            state._socket.on('disconnect',function(data){
              if (data == 'io client disconnect'){
                console.log('We disconnected from the server')              
                commit('SET_ROOM',null)
                commit('SET_PASSWORD',null)
                commit('SET_USERS',[])            
                commit('SET_CONNECTED',false)
                commit('SET_SERVER',null)
                commit('SET_CHAT',false)
                state.serverError = null
              }
              if (data == 'transport close'){
                console.log('The server disconnected on us')
              }
            })
            state._socket.on('new_message',function(msgObj){
              commit('ADD_MESSAGE',msgObj)
            })
    
          } else {
            commit('SET_ME',null)              
            commit('SET_ROOM',null)
            commit('SET_PASSWORD',null)
            commit('SET_USERS',[])
            commit('SET_CHAT',false)
          }     
          return data.callback(result)       
      })

    },
    disconnectServer({state, commit, rootState}){
      state._socket.disconnect()              
      commit('SET_ROOM',null)
      commit('SET_PASSWORD',null)
      commit('SET_USERS',[])            
      commit('SET_CONNECTED',false)
      commit('SET_SERVER',null)
      commit('SET_CHAT',false)
    },
    sendNewMessage({state, commit, rootState},msg){
      commit('ADD_MESSAGE',{
        msg: msg,
        user: {
          username: 'You',
          thumb: rootState.plex.user.thumb
        },
        type: 'message'
      })
      if (state._socket.connected){
        state._socket.emit('send_message',{
          msg: msg,
          type: 'message'
        })
      }
    },
    getServerList(){
    },
    
  }
}
function getHandshakeUser(user,room,password){
  var tempUser = {
      'username':user.username,
      'room':room,
      'password':password,
      'avatarUrl':user.thumb
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
