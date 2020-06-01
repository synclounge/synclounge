export default {
  SET_MAX_VIDEO_BITRATE: (state, maxVideoBitrate) => {
    state.maxVideoBitrate = maxVideoBitrate;
  },

  SET_METADATA: (state, metadata) => {
    state.metadata = metadata;
  },

  SET_AUDIO_STREAM_ID: (state, audioStreamID) => {
    state.audioStreamID = audioStreamID;
  },

  SET_SUBTITLE_STREAM_ID: (state, subtitleStreamID) => {
    state.subtitleStreamID = subtitleStreamID;
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
};
