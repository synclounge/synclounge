export default {
  SET_PLAYER_STATE: (state, playerState) => {
    state.playerState = playerState;
  },

  SET_PLAYER: (state, player) => {
    state.player = player;
  },

  SET_PLAYER_CONFIGURATION: (state, config) => {
    state.player.configure(config);
  },

  SET_PLAYER_UI: (state, ui) => {
    state.playerUi = ui;
  },

  SET_PLAYER_UI_CONFIGURATION: (state, config) => {
    state.playerUi.configure(config);
  },

  SET_SESSION: (state, session) => {
    state.session = session;
  },

  SET_OFFSET_MS: (state, offset) => {
    state.offsetMs = offset;
  },

  SET_MEDIA_INDEX: (state, index) => {
    state.mediaIndex = index;
  },

  SET_PLEX_DECISION: (state, decision) => {
    state.plexDecision = decision;
  },

  SET_PLAYER_CURRENT_TIME_MS: (state, timeMs) => {
    // Also update offset as fallback
    state.offsetMs = timeMs;
    if (state.player) {
      state.player.getMediaElement().currentTime = timeMs / 1000;
    }
  },

  SET_PLAYER_PLAYBACK_RATE: (state, rate) => {
    state.player.getMediaElement().playbackRate = rate;
  },

  // DOM attributes aren't reactive so you have to update this periodically
  UPDATE_PLAYER_CONTROLS_SHOWN: (state, shown) => {
    state.playerControlsShown = shown;
  },

  SET_PLAYER_CONTROLS_SHOWN_INTERVAL: (state, interval) => {
    state.playerControlsShownInterval = interval;
  },

  STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: (state) => {
    clearInterval(state.playerControlsShownInterval);
    state.playerControlsShownInterval = null;
  },

  SET_PLAYER_VOLUME: (state, volume) => {
    state.player.getMediaElement().volume = volume;
  },

  ADD_BUFFERING_EVENT_LISTENER: (state, listener) => {
    state.player.addEventListener('buffering', listener);
    state.bufferingEventListener = listener;
  },

  REMOVE_BUFFERING_EVENT_LISTENER: (state) => {
    state.player.removeEventListener('buffering', state.bufferingEventListener);
    state.bufferingEventListener = null;
  },
};
