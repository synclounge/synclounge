import { encodeUrlParams } from '@/utils/encoder';
import { qualities } from './qualities';
import { detect } from 'detect-browser';

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

const browser = detect();

export default {
  GET_PLEX_DECISION: state => state.plexDecision,

  GET_PLEX_SERVER_ID: (state, getters, rootState) =>
    state.plexServerId || rootState.route.query.chosenServer,

  GET_PLEX_SERVER: (state, getters, rootState, rootGetters) =>
    rootGetters.getPlex.servers[getters.GET_PLEX_SERVER_ID],

  GET_PLEX_SERVER_ACCESS_TOKEN: (state, getters) =>
    (getters.GET_PLEX_SERVER ? getters.GET_PLEX_SERVER.accessToken : undefined),

  GET_PLEX_SERVER_URL: (state, getters) =>
    (getters.GET_PLEX_SERVER ? getters.GET_PLEX_SERVER.chosenConnection.uri : undefined),

  GET_PLEX_SERVER_LOCATION: (state, getters) =>
    // eslint-disable-next-line no-nested-ternary
    (getters.GET_PLEX_SERVER
      ? getters.GET_PLEX_SERVER.publicAddressMatches === '1'
        ? 'lan'
        : 'wan'
      : undefined),

  GET_PART_ID: (state, getters) =>
    getters.GET_METADATA.Media[getters.GET_MEDIA_INDEX].Part[0].id,

  GET_SRC_OBJECT: (state, getters) => ({
    src: `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/start.m3u8?${encodeUrlParams(getters.GET_DECISION_AND_START_PARAMS)}`,
    type: 'application/x-mpegURL',
  }),

  GET_DECISION_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/decision`,

  GET_PART_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/library/parts/${getters.GET_PART_ID}`,

  GET_TIMELINE_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/:/timeline`,

  GET_STREAMS: (state, getters) =>
    getters.GET_METADATA.Media[getters.GET_MEDIA_INDEX].Part[0].Stream,

  GET_DECISION_STREAMS: (state, getters) =>
    getters.GET_PLEX_DECISION.MediaContainer.Metadata[0].Media[0].Part[0].Stream,

  GET_SUBTITLE_STREAMS: (state, getters) => Array.of(({
    id: 0,
    text: 'None',
  })).concat(getters.GET_STREAMS
    .filter(({ streamType }) => streamType === 3) // Subtitles are type 3
    .map(({ id, language, codec }) => ({ id, text: `${language} (${codec})` }))),

  GET_AUDIO_STREAMS: (state, getters) => getters.GET_STREAMS
    .filter(({ streamType }) => streamType === 2) // Audio streams are type 2
    .map(({
      id, language, codec, audioChannelLayout,
    }) => ({ id, text: `${language} (${codec} ${audioChannelLayout})` })),

  GET_MEDIA_LIST: (state, getters) =>
    getters.GET_METADATA.Media.map(({ videoResolution, videoCodec, bitrate }, index) => ({
      index,
      text: `${videoResolution}p  (${videoCodec} ${bitrate}kbps)`,
    })),

  GET_QUALITIES: () => qualities,
  GET_MAX_VIDEO_BITRATE: state => state.maxVideoBitrate,

  GET_AUDIO_STREAM_ID: (state, getters) => {
    if (!getters.GET_PLEX_DECISION) {
      return 0;
    }
    const selectedAudioStream = getters.GET_DECISION_STREAMS.find(stream => stream.streamType === '2' && stream.selected === '1');
    return selectedAudioStream ? parseInt(selectedAudioStream.id, 10) : 0;
  },

  GET_SUBTITLE_STREAM_ID: (state, getters) => {
    if (!getters.GET_PLEX_DECISION) {
      return 0;
    }
    const selectedSubtitleStream = getters.GET_DECISION_STREAMS.find(stream => stream.streamType === '3' && stream.selected === '1');
    return selectedSubtitleStream ? parseInt(selectedSubtitleStream.id, 10) : 0;
  },

  GET_MEDIA_INDEX: state => state.mediaIndex,

  GET_RELATIVE_THUMB_URL: (state, getters) =>
    getters.GET_METADATA.grandparentThumb || getters.GET_METADATA.thumb,

  GET_THUMB_URL: (state, getters) =>
    getters.GET_PLEX_SERVER.getUrlForLibraryLoc(getters.GET_RELATIVE_THUMB_URL, 200, 200),

  GET_RATING_KEY: (state, getters, rootState) => state.ratingKey || rootState.route.query.key,

  GET_KEY: (state, getters) => `/library/metadata/${getters.GET_RATING_KEY}`,

  GET_OFFSET: (state, getters, rootState) => state.offset || rootState.route.query.playertime,

  GET_METADATA: state => state.metadata,
  GET_PLAYER_STATE: state => state.playerState,
  GET_PLAYER: state => state.player,

  // eslint-disable-next-line no-underscore-dangle
  GET_USERACTIVE: (state, getters) => (getters.GET_PLAYER ? getters.GET_PLAYER.userActive_ : true),

  GET_PLAYER_CURRENT_TIME_MS: (state, getters) =>
    (getters.GET_PLAYER ? getters.GET_PLAYER.currentTime() * 1000 : 0),

  GET_PLAYER_DURATION_MS: (state, getters) => getters.GET_PLAYER.duration() * 1000,

  IS_TIME_IN_BUFFERED_RANGE: (state, getters) => (time) => {
    const bufferedTimeRange = getters.GET_PLAYER.buffered();

    // There can be multiple ranges
    for (let i = 0; i < bufferedTimeRange.length; ++i) {
      if (time >= bufferedTimeRange.start(i) * 1000 && time <= bufferedTimeRange.end(i) * 1000) {
        return true;
      }
    }

    return false;
  },

  GET_POLL_RESPONSE: (state, getters) => ({
    ratingKey: getters.GET_RATING_KEY,
    key: getters.GET_KEY,
    time: getters.GET_PLAYER_CURRENT_TIME_MS,
    duration: getters.GET_PLAYER_DURATION_MS,
    type: 'video',
    machineIdentifier: getters.GET_PLEX_SERVER_ID,
    state: getters.GET_PLAYER_STATE,
  }),

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


  GET_SECONDARY_TITLE: (state, getters) => {
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

  GET_BASE_PARAMS: (state, getters) => ({
    'X-Plex-Product': 'SyncLounge',
    'X-Plex-Version': '4.34.3',
    'X-Plex-Client-Identifier': state.xPlexClientIdentifier,
    'X-Plex-Platform': capitalizeFirstLetter(browser.name),
    'X-Plex-Platform-Version': browser.version,
    // 'X-Plex-Sync-Version': 2,
    // 'X-Plex-Features': 'external-media,indirect-media',
    // 'X-Plex-Model': 'hosted',
    'X-Plex-Device': browser.os,
    'X-Plex-Device-Name': capitalizeFirstLetter(browser.name),
    // TODO: fix and get stuff ugh below
    'X-Plex-Device-Screen-Resolution': `${window.screen.availWidth}x${window.screen.availHeight},${window.screen.width}x${window.screen.height}`,
    'X-Plex-Token': getters.GET_PLEX_SERVER_ACCESS_TOKEN,
    'X-Plex-Language': 'en',
  }),

  GET_PART_PARAMS: (state, getters) => ({
    'X-Plex-Text-Format': 'plain',
    'X-Plex-Provider-Version': 1.3,
    ...getters.GET_BASE_PARAMS,
  }),

  GET_DECISION_AND_START_PARAMS: (state, getters, rootState, rootGetters) => ({
    hasMDE: 1,
    path: getters.GET_KEY,
    mediaIndex: getters.GET_MEDIA_INDEX,
    partIndex: 0,
    protocol: 'hls',
    fastSeek: 1,
    directPlay: 0,
    directStream: JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 0 : 1,
    subtitleSize: 100,
    audioBoost: 100,
    location: getters.GET_PLEX_SERVER_LOCATION,
    maxVideoBitrate: getters.GET_MAX_VIDEO_BITRATE,
    addDebugOverlay: 0,
    // autoAdjustQuality: 1
    directStreamAudio: JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 0 : 1,
    mediaBufferSize: 102400, // ~100MB (same as what Plex Web uses)
    session: state.session,
    subtitles: 'burn',
    'Accept-Language': 'en',
    'X-Plex-Session-Identifier': state.xplexsessionId,
    // 'X-Plex-Client-Profile-Extra': 'append-transcode-target-codec(type=videoProfile&context=streaming&audioCodec=aac&protocol=dash)'
    'X-Plex-Incomplete-Segments': 1,
    ...getters.GET_BASE_PARAMS,
  }),

  GET_TIMELINE_PARAMS: (state, getters) => ({
    ratingKey: getters.GET_RATING_KEY,
    key: getters.GET_KEY,
    // playbackTime: 591
    // playQueueItemID: 19037144
    state: getters.GET_PLAYER_STATE,
    hasMDE: 1,
    time: Math.floor(getters.GET_PLAYER_CURRENT_TIME_MS),
    duration: Math.floor(getters.GET_PLAYER_DURATION_MS),
    'X-Plex-Session-Identifier': state.xplexsessionId,
    ...getters.GET_PART_PARAMS,
  }),
};
