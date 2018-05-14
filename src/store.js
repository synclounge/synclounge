import Vue from 'vue'
import Vuex from 'vuex'

var plex = require('./store/modules/plex/').default
var syncLounge = require('./store/modules/synclounge.js').default

const settings = require('../settings.json')

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
  setSetting('CLIENTPOLLINTERVAL', 1000)
  setSetting('DARKMODE', false)
  setSetting('SYNCMODE', 'cleanseek')
  setSetting('SYNCFLEXABILITY', 3000)
  setSetting('CUSTOMSERVER', 'http://')
  setSetting('INIT', true)
}
// Set up out web app socket for fetching short urls

const state = {
  appTitle: 'SyncLounge',
  appVersion: '2.0.0',
  background: null,
  shownChat: false,
  chosenClient: null,
  chosenClientTimeSet: (new Date()).getTime(),
  plexuser: JSON.parse(window['localStorage'].getItem('plexuser')),
  blockAutoPlay: false,
  autoJoin: false,
  autoJoinUrl: null,
  autoJoinRoom: null,
  autoJoinPassword: null,
  shortLink: null,
  extAvailable: false,
  lastRatingKey: null,
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
    // Set up our client poller
    function clientPoller (time) {
      if (!state.chosenClient) {
        return
      }
      if (state.chosenClientTimeSet !== time) {
        // We have a new chosen client, we need to stop
        return
      }
      state.chosenClient.getTimeline(function (timeline) {
        // console.log(timeline)
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
    state.chosenClientTimeSet = (new Date()).getTime()
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
  setSettingPTPLAYERQUALITY (state, data) {
    window['localStorage'].setItem('PTPLAYERQUALITY', JSON.stringify(data))
    state.PTPLAYERQUALITY = data
  },
  setSettingPTPLAYERVOLUME (state, data) {
    window['localStorage'].setItem('PTPLAYERVOLUME', JSON.stringify(data))
    state.PTPLAYERVOLUME = data
  },
  setSettingLASTSERVER (state, data) {
    window['localStorage'].setItem('LASTSERVER', data)
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
  REFRESH_PLEXDEVICES () {
    store.state.plex.getDevices(function () {})
  },
  SET_RANDOMBACKROUND (state) {
    state.plex.getRandomThumb((result) => {
      if (result) {
        state.background = result
      }
    })
  },

  // Settings
  SET_OURCLIENTRESPONSETIME (state, value) {
    state.stats.ourClientResponseTime = value
  },
  SET_OURPTSERVERRESPONSETIME (state, value) {
    state.stats.ourPTServerResponseTime = value
  },
  SET_HOSTCLIENTRESPONSETIME (state, value) {
    state.stats.hostClientResponseTime = value
  },
  SET_HOSTPTSERVERRESPONSETIME (state, value) {
    state.stats.hostPTServerResponseTime = value
  },
  SET_EXTAVAILABLE (state, value) {
    state.extAvailable = value
  },
  SET_VALUE (state, data) {
    let [key, value] = data
    state[key] = value
  }
}
const getters = {
  getAppVersion: state => {
    return state.appVersion
  },
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
  },
  getExtAvailable: state => {
    return state.extAvailable
  },
  getLogos: () => {
    return {
      light: {
        long: settings.webroot + '/logo-long-light.png',
        small: settings.webroot + '/logo-small-light.png'
      },
      dark: {
        long: settings.webroot + '/logo-long-dark.png'
      },
      plex: {
        standard: settings.webroot + '/plexlogo.png'
      }
    }
  }
}
const actions = {
  async PLAYBACK_CHANGE ({ commit, state, dispatch }, data) {
    console.log('Playback change!', state.chosenClient)
    let [client, ratingKey, mediaContainer] = data
    if (ratingKey) {
      // Playing something different!
      console.log(mediaContainer)
      let server = state.plex.servers[mediaContainer.machineIdentifier]
      state.LASTSERVER = mediaContainer.machineIdentifier
      window['localStorage'].setItem('LASTSERVER', mediaContainer.machineIdentifier)
      if (!server) {
        console.log('Playing off a server we do not have access to')
        return
      }
      // Fetch our metadata from this server
      // console.log('Loading content metadata from store ' + ratingKey)
      server.getMediaByRatingKey(ratingKey.replace('/library/metadata/', '')).then((data) => {
        console.log('Metadata:', data)
        let metadata = data.MediaContainer.Metadata[0]
        if (!metadata) {
          return
        }
        if (metadata.type === 'movie') {
          sendNotification('Now Playing: ' + metadata.title + ' from ' + state.plex.servers[metadata.machineIdentifier].name)
        }
        if (metadata.type === 'episode') {
          sendNotification('Now Playing: ' + metadata.grandparentTitle + ' S' + metadata.parentIndex + 'E' + metadata.index + ' from ' + state.plex.servers[metadata.machineIdentifier].name)
        }
        state.chosenClient.clientPlayingMetadata = metadata
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0))
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0))
        state.background = state.plex.servers[metadata.machineIdentifier].getUrlForLibraryLoc(metadata.thumb, w / 4, h / 4, 4)
      })
    } else {
      let thumb = await state.plex.getRandomThumb(state.plex)
      if (thumb) {
        state.background = thumb
      }
      state.chosenClient.clientPlayingMetadata = null
    }
  },
  NEW_TIMELINE ({ commit, state, dispatch }, data) {
    // return true
    let timeline = data
    let client = state.chosenClient
    // console.log(state)
    if (!state.chosenClient || (client.clientIdentifier !== state.chosenClient.clientIdentifier)) {
      console.log('Invalid client')
      return false
    }
    if (state.lastRatingKey !== timeline.ratingKey) {
      commit('SET_VALUE', ['lastRatingKey', timeline.ratingKey])
      dispatch('PLAYBACK_CHANGE', [client, timeline.ratingKey, timeline])
    }
    // state.ourClientResponseTime = timeline.lastResponseTime
    let title = null
    let rawTitle = null
    if (state.chosenClient.clientPlayingMetadata) {
      let metadata = state.chosenClient.clientPlayingMetadata
      rawTitle = metadata.title
      if (metadata.type === 'episode') {
        title = metadata.grandparentTitle + ' - ' + metadata.title + ' S' + metadata.parentIndex + '-' + 'E' + metadata.index
      } else {
        title = metadata.title
      }
    }
    let endObj = {
      time: timeline.time,
      maxTime: timeline.duration,
      title: title,
      rawTitle: rawTitle,
      playerState: timeline.state,
      clientResponseTime: state.chosenClient.lastResponseTime,
      playerProduct: state.chosenClient.product
    }

    if (state.synclounge._socket) {
      state.synclounge._socket.pollStartTime = (new Date()).getTime()
      state.synclounge._socket.emit('poll', endObj)
    }
  }
}

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules: {
    synclounge: syncLounge,
    plex: plex
  }
})

export default store
