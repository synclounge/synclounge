import stateFactory from './state';

export default {
  RESET: (state) => {
    Object.assign(state, stateFactory());
  },

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

  SET_ALTUSERNAME: (state, alt) => {
    state.altUsername = alt;
  },

  SET_CUSTOM_SERVER_URL: (state, url) => {
    state.customServerUrl = url;
  },

  SET_SLPLAYERQUALITY: (state, quality) => {
    state.slPlayerQuality = quality;
  },

  SET_SLPLAYERVOLUME: (state, volume) => {
    state.slPlayerVolume = volume;
  },

  SET_AUTO_SKIP_INTRO: (state, autoSkip) => {
    state.autoSkipIntro = autoSkip;
  },
};
