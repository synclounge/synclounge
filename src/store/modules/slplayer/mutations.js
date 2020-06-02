export default {
  SET_MAX_VIDEO_BITRATE: (state, maxVideoBitrate) => {
    state.maxVideoBitrate = maxVideoBitrate;
  },

  SET_METADATA: (state, metadata) => {
    state.metadata = metadata;
  },

  SET_PLAYER_STATE: (state, playerState) => {
    state.playerState = playerState;
  },

  SET_PLAYER: (state, player) => {
    state.player = player;
  },

  SET_SESSION: (state, session) => {
    state.session = session;
  },

  SET_OFFSET: (state, offset) => {
    state.offset = offset;
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

  SET_PLAYER_SRC: (state, src) => {
    state.player.src(src);
  },

  PLAY: (state) => {
    state.player.play();
  },

  PAUSE: (state) => {
    state.player.pause();
  },

  SET_PLAYER_CURRENT_TIME_MS: (state, timeMs) => {
    state.player.currentTime(timeMs / 1000);
  },

  SET_PLAYER_PLAYBACK_RATE: (state, rate) => {
    state.player.playbackRate(rate);
  },

  DISPOSE_PLAYER: (state) => {
    state.player.dispose();
    state.player = null;
  },
};
