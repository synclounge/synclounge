import axios from 'axios';

export default {
  SEND_PLEX_DECISION_REQUEST: ({ getters }) =>
    axios.get(getters.GET_DECISION_URL, {
      params: getters.GET_ALL_PARAMS,
    }),

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, maxVideoBitrate) => {
    // TODO: save to localStore persistently
    commit('SET_MAX_VIDEO_BITRATE', maxVideoBitrate);
    return dispatch.CHANGE_PLAYER_SRC;
  },

  CHANGE_AUDIO_STREAM: async ({ getters, commit, dispatch }, audioStreamID) => {
    commit('SET_AUDIO_STREAM_ID', audioStreamID);

    // Send put
    await axios.put(getters.GET_AUDIO_STREAM_CHANGE_URL);

    // Redo src
    return dispatch.CHANGE_PLAYER_SRC;
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, commit, dispatch }, subtitleStreamID) => {
    commit('SET_SUBTITLE_STREAM_ID', subtitleStreamID);


    // TODO: investigate if I really need to do this if the subtitles aren't burned

    // Send put
    await axios.put(getters.GET_SUBTITLE_STREAM_CHANGE_URL);

    // Redo src
    return dispatch.CHANGE_PLAYER_SRC;
  },

  FETCH_METADATA: async ({ commit, getters }) => {
    const result = await getters.GET_PLEX_SERVER.getMediaByRatingKey(getters.GET_KEY);
    // Always media 0
    commit('SET_METADATA', result.MediaContainer.Metadata[0]);
  },

  CHANGE_MEDIA_INDEX: () => {

  },

  CHANGE_PLAYER_SRC: async ({ getters, dispatch }) => {
    await dispatch.SEND_PLEX_DECISION_REQUEST;
    getters.GET_PLAYER.src(getters.GET_SRC);
  },

};
