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
};
