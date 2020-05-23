const { coalesce, generateGuid } = require('@/utils/helpers');
const { defaultSettings } = require('@/default-settings');


// The state must return a function
// to make the module reusable.
// See: https://vuex.vuejs.org/en/modules.html#module-reuse
const state = () => ({
  autoplay: null,
  clientPollInterval: null,
  syncMode: null,
  syncFlexibility: null,
  customServer: {
    name: 'Custom Server',
    location: 'Anywhere!',
    url: 'custom',
    image: 'synclounge-white.png',
  },
  blockedServers: [],
  'HOMEINIT': false,
  'PTPLAYERQUALITY': null,
  'PTPLAYERVOLUME': null,
  'slPlayerForceTranscode': null,
  hideUsername: null,
  altUsername: null,
  'CLIENTIDENTIFIER': `${generateGuid()}-${generateGuid()}`,
  'LASTSERVER': null
});

// Use stored value if not null, othewise fallback to config, then default values
const getters = {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) =>
    coalesce(state.autoplay, rootGetters['config/GET_CONFIG'].autoplay, defaultSettings.autoplay),
  GET_CLIENTPOLLINTERVAL: (state, getters, rootState, rootGetters) =>
    coalesce(state.clientPollInterval, rootGetters['config/GET_CONFIG'].clientPollInterval, defaultSettings.clientPollInterval),
  GET_SYNCMODE: (state, getters, rootState, rootGetters) =>
    coalesce(state.syncMode, rootGetters['config/GET_CONFIG'].syncMode, defaultSettings.syncMode),
  GET_SYNCFLEXIBILITY: (state, getters, rootState, rootGetters) =>
    coalesce(state.syncFlexibility, rootGetters['config/GET_CONFIG'].syncFlexibility, defaultSettings.syncFlexibility),
  GET_CUSTOMSERVER: (state, getters, rootState, rootGetters) =>
    coalesce(state.customServer, rootGetters['config/GET_CONFIG'].customServer),
  GET_BLOCKEDSERVERS: state => state.blockedServers,
  GET_HOMEINIT: state => state.HOMEINIT,
  GET_PTPLAYERQUALITY: (state, getters, rootState, rootGetters) =>
    coalesce(state.PTPLAYERQUALITY, rootGetters['config/GET_CONFIG'].PTPLAYERQUALITY, defaultSettings.PTPLAYERQUALITY),
  GET_PTPLAYERVOLUME: (state, getters, rootState, rootGetters) =>
    coalesce(state.PTPLAYERVOLUME, rootGetters['config/GET_CONFIG'].PTPLAYERVOLUME, defaultSettings.PTPLAYERVOLUME),
  GET_SLPLAYERFORCETRANSCODE: (state, getters, rootState, rootGetters) =>
    coalesce(state.slPlayerForceTranscode, rootGetters['config/GET_CONFIG'].slPlayerForceTranscode, defaultSettings.slPlayerForceTranscode),
  GET_HIDEUSERNAME: (state, getters, rootState, rootGetters) =>
    coalesce(state.hideUsername, rootGetters['config/GET_CONFIG'].hideUsername, defaultSettings.hideUsername),
  GET_ALTUSERNAME: state => state.altUsername,
  GET_CLIENTIDENTIFIER: state => state.CLIENTIDENTIFIER,
  GET_LASTSERVER: state => state.LASTSERVER
};

const mutations = {
  SET_AUTOPLAY: (state, autoplay) => state.autoplay = autoplay,
  SET_SLPLAYERFORCETRANSCODE: (state, force) => state.slPlayerForceTranscode = force,
  SET_CLIENTPOLLINTERVAL: (state, interval) => state.clientPollInterval = interval,
  SET_SYNCFLEXIBILITY: (state, flexibility) => state.syncFlexibility = flexibility,
  SET_SYNCMODE: (state, mode) => state.syncMode = mode,
  SET_HIDEUSERNAME: (state, hide) => state.hideUsername = hide,
  SET_ALTUSERNAME: (state, alt) => state.altUsername = alt,
  SET_BLOCKEDSERVERS: (state, blocked) => state.blockedServers = blocked,
  SET_CUSTOMSERVER: (state, server) => state.customServer = server
};

export default {
  namespaced: true,
  state,
  mutations,
  getters
};