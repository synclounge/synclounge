const { coalesce } = require('@/utils/helpers');

// Use stored value if not null, othewise fallback to config, then default values
export default {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) => coalesce(state.autoplay,
    rootGetters.GET_CONFIG.autoplay),

  GET_CLIENTPOLLINTERVAL: (state) => state.clientPollInterval,

  GET_SYNCMODE: (state) => state.syncMode,

  GET_SYNCFLEXIBILITY: (state) => state.syncFlexibility,

  GET_CUSTOMSERVER: (state, getters, rootState, rootGetters) => coalesce(state.customServer,
    rootGetters.GET_CONFIG.customServer),

  GET_SLPLAYERQUALITY: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerQuality,
    rootGetters.GET_CONFIG.slPlayerQuality,
  ) || null,

  GET_SLPLAYERVOLUME: (state) => state.slPlayerVolume,

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
