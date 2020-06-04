export default {
  SET_METADATA: (state, metadata) => {
    state.metadata = metadata;
  },

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

  SET_PLEX_SERVER_ID: (state, id) => {
    state.plexServerId = id;
  },

  SET_MEDIA_INDEX: (state, index) => {
    state.mediaIndex = index;
  },

  SET_RATING_KEY: (state, ratingKey) => {
    state.ratingKey = ratingKey;
  },

  SET_PLEX_DECISION: (state, decision) => {
    state.plexDecision = decision;
  },

  PLAY: (state) => {
    state.player.getMediaElement().play();
  },

  PAUSE: (state) => {
    state.player.getMediaElement().pause();
  },

  SET_PLAYER_CURRENT_TIME_MS: (state, timeMs) => {
    // Also update offset as fallback
    state.offsetMs = timeMs;
    state.player.getMediaElement().currentTime = timeMs / 1000;
  },

  SET_PLAYER_PLAYBACK_RATE: (state, rate) => {
    state.player.setPlaybackRate(rate);
  },

  DESTROY_PLAYER: (state) => {
    state.player.destroy();
    state.playerUi.destroy();
    state.player = null;
    state.playerUi = null;
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
};
