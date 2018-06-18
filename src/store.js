import Vue from 'vue'
import Vuex from 'vuex'

var plex = require('./store/modules/plex/').default
var syncLounge = require('./store/modules/synclounge.js').default

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
  setSetting('AUTOPLAY', true)
  setSetting('DARKMODE', false)
  setSetting('SYNCMODE', 'cleanseek')
  setSetting('SYNCFLEXABILITY', 3000)
  setSetting('CUSTOMSERVER', 'http://')
  setSetting('INIT', true)
}
let defaultSettings = {
  CLIENTPOLLINTERVAL: 1000,
  AUTOPLAY: true,
  HIDEUSERNAME: false,
  DARKMODE: false,
  SYNCMODE: 'cleanseak',
  SYNCFLEXABILITY: 3000,
  CUSTOMSERVER: 'http://',
  SLPLAYERFORCETRANSCODE: true,
  CLIENTIDENTIFIER: generateGuid() + '-' + generateGuid()
}
for (let i in defaultSettings) {
  if (getSetting(i) === undefined || getSetting(i) === null) {
    setSetting(i, defaultSettings[i])
  }
}
function generateGuid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + '-' + s4() + s4()
}

// Set up out web app socket for fetching short urls

const state = {
  appTitle: 'SyncLounge',
  appVersion: '2.0.0',
  background: null,
  shownChat: false,
  chosenClient: null,
  chosenClientTimeSet: new Date().getTime(),
  plexuser: JSON.parse(window['localStorage'].getItem('plexuser')),
  blockAutoPlay: false,
  autoJoin: false,
  autoJoinUrl: null,
  autoJoinRoom: null,
  autoJoinPassword: null,
  autoJoinUsername: null,
  shortLink: null,
  extAvailable: false,
  lastRatingKey: null,
  manualSyncQueued: false,
  uuid: generateGuid(),
  upNextCache: {},

  // SETTINGS
  settings: {
    AUTOPLAY: getSetting('AUTOPLAY'),
    CLIENTPOLLINTERVAL: getSetting('CLIENTPOLLINTERVAL'),
    SYNCMODE: getSetting('SYNCMODE'),
    SYNCFLEXABILITY: getSetting('SYNCFLEXABILITY'),
    CUSTOMSERVER: getSetting('CUSTOMSERVER'),
    BLOCKEDSERVERS: getSetting('BLOCKEDSERVERS'),
    HOMEINIT: getSetting('HOMEINIT'),
    PTPLAYERQUALITY: getSetting('PTPLAYERQUALITY'),
    PTPLAYERVOLUME: getSetting('PTPLAYERVOLUME'),
    SLPLAYERFORCETRANSCODE: getSetting('SLPLAYERFORCETRANSCODE'),
    HIDEUSERNAME: getSetting('HIDEUSERNAME'),
    ALTUSERNAME: getSetting('ALTUSERNAME'),
    CLIENTIDENTIFIER: getSetting('CLIENTIDENTIFIER')
  },

  LASTSERVER: getSetting('LASTSERVER'),
  stats: {},
  me: {}
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
      state.chosenClient.getTimeline()
      setTimeout(() => {
        clientPoller(time)
      }, state.settings.CLIENTPOLLINTERVAL)
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
    state.chosenClient.getTimeline((timeline) => {})
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
    console.log('Setting change', data[0], 'to', data[1])
    Vue.set(state.settings, data[0], data[1])
    setSetting(data[0], data[1])
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
  REFRESH_PLEXDEVICES () {
    store.state.plex.getDevices(() => {})
  },
  SET_RANDOMBACKROUND (state) {
    state.plex.getRandomThumb((result) => {
      if (result) {
        state.background = result
      }
    })
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
  getSettings: state => {
    return state.settings
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
        long: '/logo-long-light.png',
        small: '/logo-small-light.png'
      },
      dark: {
        long: '/logo-long-dark.png'
      },
      plex: {
        standard: '/plexlogo.png'
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
      state.chosenClient.clientPlayingMetadata = null
      let thumb = await state.plex.getRandomThumb(state.plex)
      if (thumb) {
        state.background = thumb
      }
    }
  },
  NEW_TIMELINE ({ commit, state, dispatch }, data) {
    console.log('Got new timeline', data.time)
    // return true
    let timeline = data
    let client = state.chosenClient
    let metadata = state.chosenClient.clientPlayingMetadata
    // console.log(state)
    if (!state.chosenClient || (client.clientIdentifier !== state.chosenClient.clientIdentifier)) {
      console.log('Invalid client')
      return false
    }
    if (state.lastRatingKey !== timeline.ratingKey) {
      commit('SET_VALUE', ['lastRatingKey', timeline.ratingKey])
      dispatch('PLAYBACK_CHANGE', [client, timeline.ratingKey, timeline])
    }

    // Check if we need to activate the upnext feature
    if (state.me && state.me.role === 'host') {
      if (timeline.duration && timeline.time && Math.abs(timeline.duration - timeline.time) < 10000 && metadata.type === 'episode') {
        console.log('Checking upnext')
        if (!state.upNextCache[timeline.machineIdentifier]) {
          state.upNextCache[timeline.machineIdentifier] = {}
        }
        if (!state.upNextCache[timeline.machineIdentifier][timeline.key]) {
          state.upNextCache[timeline.machineIdentifier][timeline.key] = {
            loading: true
          }
          state.plex.servers[timeline.machineIdentifier].getPostplay(timeline.key).then((data) => {
            data.machineIdentifier = state.chosenClient.lastTimelineObject.machineIdentifier
            state.upNextCache[timeline.machineIdentifier][timeline.key] = data
            // Only proc upnext if the item upnext is from the same show
            console.log('Checking upnext compat', data, metadata)
            if (data.MediaContainer.Hub[0].Metadata[0].grandparentTitle === metadata.grandparentTitle) {
              window.EventBus.$emit('upnext', data)
            }
          })
        } else {
          console.log('Already procced an upnext for this item', timeline)
        }
      }
    }

    // state.ourClientResponseTime = timeline.lastResponseTime
    let title = null
    let rawTitle = null
    let type = null
    let showName = null
    if (state.chosenClient.clientPlayingMetadata) {
      rawTitle = metadata.title
      if (metadata.type === 'episode') {
        title = metadata.grandparentTitle + ' - ' + metadata.title + ' S' + metadata.parentIndex + '-' + 'E' + metadata.index
        showName = metadata.grandparentTitle
      } else {
        title = metadata.title
      }
      type = metadata.type
    }
    let status = 'good'
    if (!state.synclounge.lastHostTimeline || !state.synclounge.lastHostTimeline.time) {
      status = 'error'
    } else {
      let difference = Math.abs(state.chosenClient.lastTimelineObject.time - state.synclounge.lastHostTimeline.time)
      if (difference > 1500 && difference < state.settings.SYNCFLEXABILITY) {
        status = 'ok'
      }
      if (difference > 3000) {
        status = 'notok'
      }
    }

    let endObj = {
      time: timeline.time,
      maxTime: timeline.duration,
      title: title,
      rawTitle: rawTitle,
      playerState: timeline.state,
      clientResponseTime: state.chosenClient.lastResponseTime,
      playerProduct: state.chosenClient.product,
      status,
      type,
      showName,
      uuid: state.uuid
    }
    if (state.chosenClient && state.chosenClient.lastTimelineObject) {
      endObj.machineIdentifier = state.chosenClient.lastTimelineObject.machineIdentifier
      endObj.key = state.chosenClient.lastTimelineObject.key
    }
    if (state.synclounge._socket) {
      let commandId = Object.keys(state.synclounge.commands).length + 1
      state.synclounge.commands[commandId] = {
        start: new Date().getTime()
      }
      endObj.commandId = commandId
      let latency = state.synclounge.commands[Object.keys(state.synclounge.commands).length - 1].difference
      endObj.latency = latency
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
