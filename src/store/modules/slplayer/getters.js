import { encodeUrlParams } from '@/utils/encoder';
import { qualities } from './qualities';

export default {
  GET_BASE_PARAMS: (state, getters, rootState, rootGetters) => ({
    'X-Plex-Product': 'SyncLounge',
    'X-Plex-Version': '4.34.3',
    'X-Plex-Client-Identifier': 'SyncLounge',
    // TODO: replace with browser
    'X-Plex-Platform': 'SyncLounge',
    // TODO: replace with browser version
    'X-Plex-Platform-Version': '81.0',
    'X-Plex-Device': JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 'HTML TV App' : 'Web',
    'X-Plex-Language': 'en',
    'X-Plex-Device-Name': 'SyncLounge',
    'X-Plex-Provider-Version': '1.3',
    'X-Plex-Device-Screen-Resolution': `${window.screen.availWidth}x${window.screen.availHeight}`,
    'X-Plex-Token': getters.GET_PLEX_SERVER.accessToken,
  }),

  GET_ALL_PARAMS: (state, getters, rootState, rootGetters) => {
    const params = {
      maxVideoBitrate: getters.GET_MAX_VIDEO_BITRATE,
      hasMDE: 1,
      path: getters.GET_KEY,
      mediaIndex: getters.GET_MEDIA_INDEX,
      partIndex: 0,
      // TODO: make protocol configurable (add dash support)
      protocol: 'hls',
      fastSeek: 1,
      directPlay: 0,
      directStream: JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 0 : 1,
      directStreamAudio: JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 0 : 1,
      subtitleSize: 100,
      audioBoost: 100,
      location: getters.GET_PLEX_SERVER.publicAddressMatches === '1' ? 'lan' : 'wan',
      // sessionId changes when you change anything about the playback
      session: state.session,
      subtitles: 'burn',
      copyts: 1,
      mediaBufferSize: 102400, // ~100MB (same as what Plex Web uses)
      'Accept-Language': 'en',
      // TODO: alter below
      // 'X-Plex-Client-Profile-Extra': 'add-limitation(scope=videoCodec&scopeName=*&type=upperBound&name=video.bitrate&value=2000&replace=true)+append-transcode-target-codec(type=videoProfile&context=streaming&audioCodec=aac&protocol=dash)',
      'X-Plex-Session-Identifier': state.xplexsessionId,
    };

    return { ...params, ...getters.GET_BASE_PARAMS };
  },

  GET_PLEX_SERVER_ID: (state, getters, rootState) =>
    state.plexServerId || rootState.route.query.chosenServer,

  GET_PLEX_SERVER: (state, getters, rootState, rootGetters) =>
    rootGetters.getPlex.servers[getters.GET_PLEX_SERVER_ID],

  GET_PLEX_SERVER_URL: (state, getters) => getters.GET_PLEX_SERVER.chosenConnection.uri,

  GET_PART_ID: (state, getters) =>
    getters.GET_METADATA.Media[getters.GET_MEDIA_INDEX].Part[0].id,

  GET_SRC_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/start.m3u8?${encodeUrlParams(getters.GET_ALL_PARAMS)}`,

  GET_DECISION_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/decision`,

  GET_PART_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/library/parts/${getters.GET_PART_ID}`,

  GET_TIMELINE_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/:/timeline`,

  GET_AUDIO_STREAM_CHANGE_URL: (state, getters) => `${getters.GET_PART_URL}?${encodeUrlParams({ ...getters.GET_BASE_PARAMS, audioStreamID: state.audioStreamID })}`,

  GET_SUBTITLE_STREAM_CHANGE_URL: (state, getters) => `${getters.GET_PART_URL}?${encodeUrlParams({ ...getters.GET_BASE_PARAMS, subtitleStreamID: state.subtitleStreamID })}`,

  GET_SUBTITLE_STREAMS: (state, getters) => Array.of(({
    id: -1,
    text: 'None',
  })).concat(getters.GET_METADATA.Media[state.mediaIndex].Part[0].Stream
    .filter(({ streamType }) => streamType === 3) // Subtitles are type 3
    .map(({ id, language, codec }) => ({ id, text: `${language} (${codec})` }))),

  GET_AUDIO_STREAMS: (state, getters) => getters.GET_METADATA.Media[state.mediaIndex].Part[0].Stream
    .filter(({ streamType }) => streamType === 2) // Audio streams are type 2
    .map(({
      id, language, codec, audioChannelLayout,
    }) => ({ id, text: `${language} (${codec} ${audioChannelLayout})` })),

  GET_MEDIA_LIST: (state, getters) => getters.GET_METADATA.Media.map(({
    id, videoResolution, videoCodec, bitrate,
  }) => ({
    id,
    text: `${videoResolution}p  (${videoCodec} ${bitrate}kbps)`,
  })),

  GET_QUALITIES: () => qualities,
  GET_MAX_VIDEO_BITRATE: state => state.maxVideoBitrate,
  GET_AUDIO_STREAM_ID: state => state.audioStreamID,
  GET_SUBTITLE_STREAM_ID: state => state.subtitleStreamID,
  GET_MEDIA_INDEX: state => state.mediaIndex,

  GET_RELATIVE_THUMB_URL: (state, getters) =>
    getters.GET_METADATA.grandparentThumb || getters.GET_METADATA.thumb,

  GET_THUMB_URL: (state, getters) =>
    getters.GET_PLEX_SERVER.getUrlForLibraryLoc(getters.GET_RELATIVE_THUMB_URL, 200, 200),

  GET_RATING_KEY: (state, getters, rootState) => state.ratingKey || rootState.route.query.key,

  GET_KEY: (state, getters) => getters.GET_METADATA.key,

  GET_OFFSET: (state, getters, rootState) => state.offset || rootState.route.query.playertime,

  GET_METADATA: state => state.metadata,
  GET_PLAYER_STATE: state => state.playerState,
  GET_PLAYER: state => state.player,

  GET_TITLE: (state, getters) => {
    switch (getters.GET_METADATA.type) {
      case 'movie':
        return getters.GET_METADATA.title;

      case 'show':
        return getters.GET_METADATA.title;

      case 'season':
        return getters.GET_METADATA.title;

      case 'episode':
        return getters.GET_METADATA.grandparentTitle;

      default:
        return getters.GET_METADATA.title;
    }
  },


  GET_SUBTITLE: (state, getters) => {
    switch (getters.GET_METADATA.type) {
      case 'movie':
        return getters.GET_METADATA.year ? state.metadata.year : ' ';

      case 'show':
        return getters.GET_METADATA.childCount === 1
          ? `${getters.GET_METADATA.childCount} season`
          : `${getters.GET_METADATA.childCount} seasons`;

      case 'season':
        return `${getters.GET_METADATA.leafCount} episodes`;

      case 'album':
        return getters.GET_METADATA.year;

      case 'artist':
        return '';

      case 'episode':
        return (
          ` S${
            getters.GET_METADATA.parentIndex
          }E${
            getters.GET_METADATA.index
          } - ${
            getters.GET_METADATA.title}`
        );

      default:
        return getters.GET_METADATA.title;
    }
  },
};
