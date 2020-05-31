import axios from 'axios';
import xml2js from 'xml2js';
import { encodeUrlParams } from '@/utils/encoder';


export default {
  SEND_PLEX_DECISION_REQUEST: ({ getters }) =>
    axios.get(getters.GET_DECISION_URL, {
      params: getters.GET_ALL_PARAMS,
    }),

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, maxVideoBitrate) => {
    // TODO: save to localStore persistently
    commit('SET_MAX_VIDEO_BITRATE', maxVideoBitrate);

    await dispatch.SEND_PLEX_DECISION_REQUEST;
    // TODO: have player redo src req
  },

  CHANGE_AUDIO_STREAM: async ({ getters, commit, dispatch }, audioStreamID) => {
    commit('SET_AUDIO_STREAM_ID', audioStreamID);

    // Send put
    await axios.put(getters.GET_AUDIO_STREAM_CHANGE_URL);

    // Send decision
    await dispatch.SEND_PLEX_DECISION_REQUEST;

    // Redo src
  },


  CHANGE_SUBTITLE_STREAM: async ({ getters, commit, dispatch }, subtitleStreamID) => {
    commit('SET_SUBTITLE_STREAM_ID', subtitleStreamID);


    // TODO: investigate if I really need to do this if the subtitles aren't burned

    // Send put
    await axios.put(getters.GET_SUBTITLE_STREAM_CHANGE_URL);

    // Send decision
    await dispatch.SEND_PLEX_DECISION_REQUEST;

    // Redo src
  },

  changedPlaying: async ({ commit, getters, dispatch }) => {
    this.ready = false;
    this.$store.commit('SET_VALUE', ['decisionBlocked', false]);
    console.log('Changed what we are meant to be playing!', changeItem);
    if (!this.chosenKey || !this.chosenServer) {
      this.playerstatus = 'stopped';
      this.playerMetadata = null;
      return;
    }

    if (!changeItem) {
      // Update offset to current time to resume where we were
      this.offset = this.playertime;
    }
  },


  FETCH_METADATA: async ({ commit, getters }) => {
    const result = await getters.GET_PLEX_SERVER.getMediaByRatingKey(getters.GET_KEY);
    // Always media 0
    commit('SET_METADATA', result.MediaContainer.Metadata[0]);
  },

  CHANGE_MEDIA_INDEX: () => {

  },

};
