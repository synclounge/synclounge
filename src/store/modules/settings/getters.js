import coalesce from '@/utils/coalesce';

// Use stored value if not null, othewise fallback to config, then default values
export default {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) => coalesce(state.autoplay,
    rootGetters.GET_CONFIG.default_slplayer_autoplay),

  GET_CLIENTPOLLINTERVAL: (state, getters, rootState, rootGetters) => coalesce(
    state.clientPollInterval,
    rootGetters.GET_CONFIG.default_client_poll_interval,
  ),

  GET_SYNCMODE: (state, getters, rootState, rootGetters) => coalesce(
    state.syncMode,
    rootGetters.GET_CONFIG.default_sync_mode,
  ),

  GET_SYNCFLEXIBILITY: (state, getters, rootState, rootGetters) => coalesce(
    state.syncFlexibility,
    rootGetters.GET_CONFIG.default_sync_flexability,
  ),

  GET_SLPLAYERQUALITY: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerQuality,
    rootGetters.GET_CONFIG.default_slplayer_quality,
  ) || null,

  GET_SLPLAYERVOLUME: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerVolume,
    rootGetters.GET_CONFIG.default_slplayer_volume,
  ),

  GET_SLPLAYERFORCETRANSCODE: (state, getters, rootState, rootGetters) => coalesce(
    state.slPlayerForceTranscode,
    rootGetters.GET_CONFIG.default_slplayer_force_transcode,
  ),

  GET_HIDEUSERNAME: (state) => state.hideUsername,
  GET_ALTUSERNAME: (state) => state.altUsername,
  GET_CLIENTIDENTIFIER: (state) => state.clientIdentifier,
  GET_CUSTOM_SERVER_USER_INPUTTED_URL: (state) => state.customServerUserInputtedUrl,
  GET_PLEX_AUTH_TOKEN: (state) => state.plexAuthToken,
};
