const { coalesce } = require('@/utils/helpers');

// Use stored value if not null, othewise fallback to config, then default values
export default {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) => coalesce(state.autoplay,
    rootGetters.GET_CONFIG.autoplay),

  GET_CLIENTPOLLINTERVAL: (state, getters, rootState, rootGetters) => coalesce(
    state.clientPollInterval,
    rootGetters.GET_CONFIG.clientPollInterval,
  ),

  GET_SYNCMODE: (state, getters, rootState, rootGetters) => coalesce(state.syncMode,
    rootGetters.GET_CONFIG.syncMode),

  GET_SYNCFLEXIBILITY: (state, getters, rootState, rootGetters) => coalesce(
    state.syncFlexibility,
    rootGetters.GET_CONFIG.syncFlexibility,
  ),

  GET_CUSTOMSERVER: (state, getters, rootState, rootGetters) => coalesce(state.customServer,
    rootGetters.GET_CONFIG.customServer),

  GET_SLPLAYERQUALITY: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerQuality,
    rootGetters.GET_CONFIG.slPlayerQuality,
  ) || null,

  GET_SLPLAYERVOLUME: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerVolume,
    rootGetters.GET_CONFIG.slPlayerVolume,
  ),

  GET_SLPLAYERFORCETRANSCODE: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerForceTranscode,
    rootGetters.GET_CONFIG.slPlayerForceTranscode,
  ),

  GET_HIDEUSERNAME: (state) => state.hideUsername,
  GET_ALTUSERNAME: (state) => state.altUsername,
  GET_CLIENTIDENTIFIER: (state) => state.clientIdentifier,
  GET_CUSTOM_SERVER_USER_INPUTTED_URL: (state) => state.customServerUserInputtedUrl,
  GET_PLEX_AUTH_TOKEN: (state) => state.plexAuthToken,
};
