export default {
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
  SET_CUSTOM_SERVER_USER_INPUTTED_URL: (state, url) => {
    state.customServerUserInputtedUrl = url;
  },
  SET_SLPLAYERQUALITY: (state, quality) => {
    state.slPlayerQuality = quality;
  },
  SET_SLPLAYERVOLUME: (state, volume) => {
    state.slPlayerVolume = volume;
  },
};
