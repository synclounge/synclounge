import Vue from 'vue'
import Vuex from 'vuex'

import moment from '../node_modules/moment/moment.js'

var plex = require('./store/modules/plex/').default
var plexTogether = require('./store/modules/plextogether.js').default

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
  appTitle: 'PlexTogether',
  appVersion: '2.0.0',
  background: null,
  shownChat: false,
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
    async function playbackChange (ratingKey) {
      console.log('Playback change!', ratingKey)
      if (ratingKey != null) {
        // Playing something different!
        let server = state.plex.servers[state.chosenClient.lastTimelineObject.machineIdentifier]
        state.LASTSERVER = state.chosenClient.lastTimelineObject.machineIdentifier        
        window['localStorage'].setItem('LASTSERVER', state.chosenClient.lastTimelineObject.machineIdentifier)
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
            sendNotification('Now Playing: ' + metadata.title + ' from ' + state.plex.servers[metadata.machineIdentifier].name)
          }
          if (metadata.type == 'episode') {
            sendNotification('Now Playing: ' + metadata.grandparentTitle + ' S' + metadata.parentIndex + 'E' + metadata.index + ' from ' + state.plex.servers[metadata.machineIdentifier].name)
          }
          state.chosenClient.clientPlayingMetadata = metadata
          var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
          var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
          state.background =  state.plex.servers[metadata.machineIdentifier].getUrlForLibraryLoc(metadata.thumb, w / 4, h / 4, 4)
        })
      } else {
        let thumb = await state.plex.getRandomThumb(state.plex)
        if (thumb) {
          state.background = thumb
        }
        state.chosenClient.clientPlayingMetadata = null
      }
    }

    function newTimeline (timeline) {
      console.log('Got timeline')
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

      if (state.plextogether._socket) {
        state.plextogether._socket.pollStartTime = (new Date).getTime()
        state.plextogether._socket.emit('poll', end_obj)
      }
    }

    // Set up our client poller
    function clientPoller (time) {
      if (!state.chosenClient) {
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



const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules: {
    plextogether: plexTogether,
    plex: plex
  }
})

export default store
