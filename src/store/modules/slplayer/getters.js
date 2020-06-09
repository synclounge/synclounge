import { encodeUrlParams } from '@/utils/encoder';
import contenttitleutils from '@/utils/contenttitleutils';
import { qualities } from './qualities';


export default {
  GET_PLEX_DECISION: (state) => state.plexDecision,

  GET_PLEX_SERVER_ID: (state, getters, rootState) => state.plexServerId
    || rootState.route.query.machineIdentifier,

  GET_PLEX_SERVER: (state, getters, rootState, rootGetters) => rootGetters.getPlex
    .servers[getters.GET_PLEX_SERVER_ID],

  GET_PLEX_SERVER_ACCESS_TOKEN: (state, getters) => (getters.GET_PLEX_SERVER
    ? getters.GET_PLEX_SERVER.accessToken
    : undefined),

  GET_PLEX_SERVER_URL: (state, getters) => (getters.GET_PLEX_SERVER
    ? getters.GET_PLEX_SERVER.chosenConnection.uri
    : undefined),

  // eslint-disable-next-line no-nested-ternary
  GET_PLEX_SERVER_LOCATION: (state, getters) => (getters.GET_PLEX_SERVER
    ? getters.GET_PLEX_SERVER.publicAddressMatches === '1'
      ? 'lan'
      : 'wan'
    : undefined),

  GET_PART_ID: (state, getters) => getters.GET_METADATA.Media[getters.GET_MEDIA_INDEX].Part[0].id,

  GET_SRC_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/start.mpd?${encodeUrlParams(getters.GET_DECISION_AND_START_PARAMS)}`,

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

  GET_MEDIA_LIST: (state, getters) => getters.GET_METADATA.Media.map(
    ({ videoResolution, bitrate }, index) => ({
      index,
      text: `${Math.round(bitrate / 100) / 10} Mbps, ${videoResolution}p`,
    }),
  ),

  GET_QUALITIES: () => qualities,

  GET_AUDIO_STREAM_ID: (state, getters) => {
    const selectedAudioStream = getters.GET_DECISION_STREAMS
      .find((stream) => stream.streamType === '2' && stream.selected === '1');
    return selectedAudioStream ? parseInt(selectedAudioStream.id, 10) : 0;
  },

  GET_SUBTITLE_STREAM_ID: (state, getters) => {
    const selectedSubtitleStream = getters.GET_DECISION_STREAMS
      .find((stream) => stream.streamType === '3' && stream.selected === '1');
    return selectedSubtitleStream ? parseInt(selectedSubtitleStream.id, 10) : 0;
  },

  GET_MEDIA_INDEX: (state, getters, rootState) => state.mediaIndex
    || rootState.route.query.mediaIndex,

  GET_RELATIVE_THUMB_URL: (state, getters) => getters.GET_METADATA.grandparentThumb
    || getters.GET_METADATA.thumb,

  GET_THUMB_URL: (state, getters) => getters.GET_PLEX_SERVER
    .getUrlForLibraryLoc(getters.GET_RELATIVE_THUMB_URL, 200, 200),

  GET_RATING_KEY: (state, getters) => getters.GET_KEY.replace('/library/metadata/', ''),

  GET_KEY: (state, getters, rootState) => state.key || rootState.route.query.key,

  GET_OFFSET_MS: (state, getters, rootState) => state.offsetMs || rootState.route.query.offset,

  GET_METADATA: (state) => state.metadata,
  GET_PLAYER_STATE: (state) => state.playerState,
  GET_PLAYER: (state) => state.player,
  GET_PLAYER_UI: (state) => state.playerUi,

  GET_TITLE: (state, getters) => contenttitleutils.getTitle(getters.GET_METADATA),
  GET_SECONDARY_TITLE: (state, getters) => contenttitleutils
    .getSecondaryTitle(getters.GET_METADATA),


  GET_PART_PARAMS: (state, getters, rootState, rootGetters) => ({
    'X-Plex-Text-Format': 'plain',
    'X-Plex-Provider-Version': 1.3,
    ...rootGetters.GET_PLEX_BASE_PARAMS(getters.GET_PLEX_SERVER_ACCESS_TOKEN),
  }),

  GET_PLEX_PROFILE_EXTRAS: (state, getters, rootState, rootGetters) => {
    const base = 'append-transcode-target-codec(type=videoProfile&context=streaming&audioCodec=aac&protocol=dash)';
    return rootGetters['settings/GET_SLPLAYERQUALITY']
      ? `${base}+add-limitation(scope=videoCodec&scopeName=*&type=upperBound&name=video.bitrate&value=${rootGetters['settings/GET_SLPLAYERQUALITY']}&replace=true)`
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
    directStream: rootGetters['settings/GET_SLPLAYERFORCETRANSCODE'] ? 0 : 1,
    subtitleSize: 100,
    audioBoost: 100,
    location: getters.GET_PLEX_SERVER_LOCATION,
    ...rootGetters['settings/GET_SLPLAYERQUALITY'] && { maxVideoBitrate: rootGetters['settings/GET_SLPLAYERQUALITY'] }, // only include if not null
    addDebugOverlay: 0,
    autoAdjustQuality: 1,
    directStreamAudio: rootGetters['settings/GET_SLPLAYERFORCETRANSCODE'] ? 0 : 1,
    mediaBufferSize: 102400, // ~100MB (same as what Plex Web uses)
    session: state.session,
    subtitles: 'burn',
    'Accept-Language': 'en',
    'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
    'X-Plex-Client-Profile-Extra': getters.GET_PLEX_PROFILE_EXTRAS,
    'X-Plex-Incomplete-Segments': 1,
    ...rootGetters.GET_PLEX_BASE_PARAMS(getters.GET_PLEX_SERVER_ACCESS_TOKEN),
  }),

  ARE_PLAYER_CONTROLS_SHOWN: (state) => state.playerControlsShown,

  GET_PLAYER_MEDIA_ELEMENT: (state) => state.player.getMediaElement(),

  GET_X_PLEX_SESSION_ID: (state) => state.xplexsessionId,
};
