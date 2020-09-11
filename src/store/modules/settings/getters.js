// Use stored value if not null, othewise fallback to config, then default values
export default {
  GET_AUTOPLAY: (state, getters, rootState, rootGetters) => state.autoplay
   ?? rootGetters.GET_CONFIG.default_slplayer_autoplay,

  GET_CLIENTPOLLINTERVAL: (state, getters, rootState, rootGetters) => state.clientPollInterval
    ?? rootGetters.GET_CONFIG.default_client_poll_interval,

  GET_SYNCMODE: (state, getters, rootState, rootGetters) => state.syncMode
    ?? rootGetters.GET_CONFIG.default_sync_mode,

  GET_SYNCFLEXIBILITY: (state, getters, rootState, rootGetters) => state.syncFlexibility
    ?? rootGetters.GET_CONFIG.default_sync_flexability,

  GET_SLPLAYERQUALITY: (state, getters, rootState, rootGetters) => state.slPlayerQuality
    ?? rootGetters.GET_CONFIG.default_slplayer_quality ?? null,

  GET_SLPLAYERVOLUME: (state, getters, rootState, rootGetters) => state.slPlayerVolume
    ?? rootGetters.GET_CONFIG.default_slplayer_volume,

  GET_SLPLAYERFORCETRANSCODE: (state, getters, rootState, rootGetters) => state
    .slPlayerForceTranscode
    ?? rootGetters.GET_CONFIG.default_slplayer_force_transcode,

  GET_ALTUSERNAME: (state) => state.altUsername,
  GET_CUSTOM_SERVER_USER_INPUTTED_URL: (state) => state.customServerUserInputtedUrl,

  GET_AUTO_SKIP_INTRO: (state, getters, rootState, rootGetters) => state.autoSkipIntro
    ?? rootGetters.GET_CONFIG.default_auto_skip_intro,
};
