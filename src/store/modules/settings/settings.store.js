const { coalesce, generateGuid } = require('@/utils/helpers');
const { defaultSettings } = require('@/default-settings');

// The state must return a function
// to make the module reusable.
// See: https://vuex.vuejs.org/en/modules.html#module-reuse
// All of these settings are stored in localStorage and are persistent across reloads
const defaultState = () => ({
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
  customServerUserInputtedUrl: 'http://',
  blockedServers: [],
  slPlayerQuality: null,
  slPlayerVolume: null,
  slPlayerForceTranscode: null,
  hideUsername: null,
  altUsername: null,
  clientIdentifier: `${generateGuid()}-${generateGuid()}`,
  lastServer: null,
  plexAuthToken: null,
  recentRooms: [],
});

// Use stored value if not null, othewise fallback to config, then default values
const moduleGetters = {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) =>
    coalesce(state.autoplay, rootGetters['config/GET_CONFIG'].autoplay, defaultSettings.autoplay),
  GET_CLIENTPOLLINTERVAL: (state, getters, rootState, rootGetters) =>
    coalesce(
      state.clientPollInterval,
      rootGetters['config/GET_CONFIG'].clientPollInterval,
      defaultSettings.clientPollInterval,
    ),
  GET_SYNCMODE: (state, getters, rootState, rootGetters) =>
    coalesce(state.syncMode, rootGetters['config/GET_CONFIG'].syncMode, defaultSettings.syncMode),
  GET_SYNCFLEXIBILITY: (state, getters, rootState, rootGetters) =>
    coalesce(
      state.syncFlexibility,
      rootGetters['config/GET_CONFIG'].syncFlexibility,
      defaultSettings.syncFlexibility,
    ),
  GET_CUSTOMSERVER: (state, getters, rootState, rootGetters) =>
    coalesce(state.customServer, rootGetters['config/GET_CONFIG'].customServer),
  GET_BLOCKEDSERVERS: (state) => state.blockedServers,
  GET_SLPLAYERQUALITY: (state, getters, rootState, rootGetters) =>
    coalesce(
      state.slPlayerQuality,
      rootGetters['config/GET_CONFIG'].slPlayerQuality,
      defaultSettings.slPlayerQuality,
    ),
  GET_SLPLAYERVOLUME: (state, getters, rootState, rootGetters) =>
    coalesce(
      state.slPlayerVolume,
      rootGetters['config/GET_CONFIG'].slPlayerVolume,
      defaultSettings.slPlayerVolume,
    ),
  GET_SLPLAYERFORCETRANSCODE: (state, getters, rootState, rootGetters) =>
    coalesce(
      state.slPlayerForceTranscode,
      rootGetters['config/GET_CONFIG'].slPlayerForceTranscode,
      defaultSettings.slPlayerForceTranscode,
    ),
  GET_HIDEUSERNAME: (state, getters, rootState, rootGetters) =>
    coalesce(
      state.hideUsername,
      rootGetters['config/GET_CONFIG'].hideUsername,
      defaultSettings.hideUsername,
    ),
  GET_ALTUSERNAME: (state) => state.altUsername,
  GET_CLIENTIDENTIFIER: (state) => state.clientIdentifier,
  GET_LASTSERVER: (state) => state.lastServer,
  GET_CUSTOM_SERVER_USER_INPUTTED_URL: (state) => state.customServerUserInputtedUrl,
  GET_PLEX_AUTH_TOKEN: (state) => state.plexAuthToken,
  GET_RECENT_ROOMS: (state) => state.recentRooms,
};

const mutations = {
  SET_AUTOPLAY: (state, autoplay) => {
    state.autoplay = autoplay;
  },
  SET_SLPLAYERFORCETRANSCODE: (state, force) => {
    state.slPlayerForceTranscode = force;
  },
  SET_CLIENTPOLLINTERVAL: (state, interval) => {
    state.clientPollInterval = interval;
  },
  SET_SYNCFLEXIBILITY: (state, flexibility) => {
    state.syncFlexibility = flexibility;
  },
  SET_SYNCMODE: (state, mode) => {
    state.syncMode = mode;
  },
  SET_HIDEUSERNAME: (state, hide) => {
    state.hideUsername = hide;
  },
  SET_ALTUSERNAME: (state, alt) => {
    state.altUsername = alt;
  },
  SET_BLOCKEDSERVERS: (state, blocked) => {
    state.blockedServers = blocked;
  },
  SET_CUSTOM_SERVER_USER_INPUTTED_URL: (state, url) => {
    state.customServerUserInputtedUrl = url;
  },
  SET_SLPLAYERQUALITY: (state, quality) => {
    state.slPlayerQuality = quality;
  },
  SET_LASTSERVER: (state, server) => {
    state.lastServer = server;
  },
  SET_SLPLAYERVOLUME: (state, volume) => {
    state.slPlayerVolume = volume;
  },
  SET_PLEX_AUTH_TOKEN: (state, token) => {
    state.plexAuthToken = token;
  },
  SET_RECENT_ROOMS: (state, rooms) => {
    state.recentRooms = rooms;
  },
};

const actions = {
  ADD_RECENT_ROOM: ({ commit, getters }, newRoom) =>
    commit(
      'SET_RECENT_ROOMS',
      Array.of(newRoom).concat(
        getters.GET_RECENT_ROOMS.filter(
          (room) => room.server !== newRoom.server || room.room !== newRoom.room,
        ),
      ),
    ),

  REMOVE_RECENT_ROOM: ({ commit, getters }, roomToRemove) =>
    commit(
      'SET_RECENT_ROOMS',
      getters.GET_RECENT_ROOMS.filter(
        (room) => room.server !== roomToRemove.server || room.room !== roomToRemove.room,
      ),
    ),
};

export default {
  namespaced: true,
  state: defaultState,
  mutations,
  getters: moduleGetters,
  actions,
};
