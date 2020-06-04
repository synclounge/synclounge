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

  GET_SRC_URL: (state, getters) =>
    `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/start.mpd?${encodeUrlParams(getters.GET_DECISION_AND_START_PARAMS)}`,

  GET_DECISION_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/decision`,

  GET_PART_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/library/parts/${getters.GET_PART_ID}`,

  GET_TIMELINE_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/:/timeline`,

  GET_STREAMS: (state, getters) => (getters.GET_METADATA
    ? getters.GET_METADATA.Media[getters.GET_MEDIA_INDEX].Part[0].Stream
    : []),

  GET_DECISION_STREAMS: (state, getters) => (getters.GET_PLEX_DECISION
    ? getters.GET_PLEX_DECISION.MediaContainer.Metadata[0].Media[0].Part[0].Stream
    : []),

  GET_SUBTITLE_STREAMS: (state, getters) => Array.of(({
    id: 0,
    text: 'None',
  })).concat(getters.GET_STREAMS
    .filter(({ streamType }) => streamType === 3) // Subtitles are type 3
    .map(({ id, displayTitle }) => ({ id, text: displayTitle }))),

  GET_AUDIO_STREAMS: (state, getters) => getters.GET_STREAMS
    .filter(({ streamType }) => streamType === 2) // Audio streams are type 2
    .map(({
      id, displayTitle,
    }) => ({ id, text: displayTitle })),

  GET_MEDIA_LIST: (state, getters) =>
    getters.GET_METADATA.Media.map(({ videoResolution, bitrate }, index) => ({
      index,
      text: `${Math.round(bitrate / 100) / 10} Mbps, ${videoResolution}p`,
    })),

  GET_QUALITIES: () => qualities,

  // TODO: fix this when the config PR is added
  GET_MAX_VIDEO_BITRATE: (state, getters, rootState, rootGetters) => {
    const qualityLabel = rootGetters.getSettingPTPLAYERQUALITY || JSON.parse(window.localStorage.getItem('PTPLAYERQUALITY'));
    const quality = getters.GET_QUALITIES.find(({ label }) => label === qualityLabel);
    return quality ? quality.maxVideoBitrate : null;
  },

  GET_AUDIO_STREAM_ID: (state, getters) => {
    const selectedAudioStream = getters.GET_DECISION_STREAMS.find(stream => stream.streamType === '2' && stream.selected === '1');
    return selectedAudioStream ? parseInt(selectedAudioStream.id, 10) : 0;
  },

  GET_SUBTITLE_STREAM_ID: (state, getters) => {
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

  GET_OFFSET_MS: (state, getters, rootState) => state.offsetMs || rootState.route.query.playertime,

  GET_METADATA: state => state.metadata,
  GET_PLAYER_STATE: state => state.playerState,
  GET_PLAYER: state => state.player,
  GET_PLAYER_UI: state => state.playerUi,

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
        return getters.GET_METADATA.year ? getters.GET_METADATA.year : ' ';

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
    'X-Plex-Model': 'hosted',
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

  GET_PLEX_PROFILE_EXTRAS: (state, getters) => {
    const base = 'append-transcode-target-codec(type=videoProfile&context=streaming&audioCodec=aac&protocol=dash)';
    return getters.GET_MAX_VIDEO_BITRATE
      ? `${base}+add-limitation(scope=videoCodec&scopeName=*&type=upperBound&name=video.bitrate&value=${getters.GET_MAX_VIDEO_BITRATE}&replace=true)`
      : base;
  },

  GET_DECISION_AND_START_PARAMS: (state, getters, rootState, rootGetters) => ({
    hasMDE: 1,
    path: getters.GET_KEY,
    mediaIndex: getters.GET_MEDIA_INDEX,
    partIndex: 0,
    protocol: 'dash',
    fastSeek: 1,
    directPlay: 0,
    directStream: JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 0 : 1,
    subtitleSize: 100,
    audioBoost: 100,
    location: getters.GET_PLEX_SERVER_LOCATION,
    ...getters.GET_MAX_VIDEO_BITRATE && { maxVideoBitrate: getters.GET_MAX_VIDEO_BITRATE }, // only include if not null
    addDebugOverlay: 0,
    autoAdjustQuality: 1,
    directStreamAudio: JSON.parse(rootGetters.getSettings.SLPLAYERFORCETRANSCODE) ? 0 : 1,
    mediaBufferSize: 102400, // ~100MB (same as what Plex Web uses)
    session: state.session,
    subtitles: 'burn',
    'Accept-Language': 'en',
    'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
    'X-Plex-Client-Profile-Extra': getters.GET_PLEX_PROFILE_EXTRAS,
    'X-Plex-Incomplete-Segments': 1,
    ...getters.GET_BASE_PARAMS,
  }),

  ARE_PLAYER_CONTROLS_SHOWN: state => state.playerControlsShown,

  GET_PLAYER_MEDIA_ELEMENT: state => state.player.getMediaElement(),

  GET_X_PLEX_SESSION_ID: (state) => state.xplexsessionId,
};
