import { makeUrl } from '@/utils/fetchutils';
import { protocolExtension } from '@/utils/streamingprotocols';
import contenttitleutils from '@/utils/contenttitleutils';
import { isVideoSupported, isAudioSupported, isContainerSupported } from '@/utils/mediasupport';
import qualities from './qualities';

const buggyChromeBitrate = 23000;

export default {
  GET_PLEX_DECISION: (state) => state.plexDecision,

  IS_IN_BUGGY_CHROME_STATE: (state, getters, rootState, rootGetters) => (
    rootGetters.GET_BROWSER.name === 'chrome'
      || rootGetters.GET_BROWSER.name === 'edge-chromium')
    && (rootGetters['settings/GET_SLPLAYERQUALITY'] == null
      || rootGetters['settings/GET_SLPLAYERQUALITY'] > buggyChromeBitrate)
    && rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
      ?.Media?.[getters.GET_MEDIA_INDEX]?.bitrate > buggyChromeBitrate,

  // TODO: Remove this hack when this issue is fixed
  // https://forums.plex.tv/t/plex-skipping-forward-by-a-few-seconds-on-web-player/402112
  GET_STREAMING_PROTOCOL: (state, getters) => (getters.IS_IN_BUGGY_CHROME_STATE
    ? 'hls'
    : state.streamingProtocol),

  GET_PLEX_SERVER: (state, getters, rootState, rootGetters) => rootGetters[
    'plexservers/GET_PLEX_SERVER'](rootGetters['plexclients/GET_ACTIVE_SERVER_ID']),

  GET_PLEX_SERVER_ACCESS_TOKEN: (state, getters) => (getters.GET_PLEX_SERVER
    ? getters.GET_PLEX_SERVER.accessToken
    : undefined),

  // TODO: move this stuff into plexservers probably
  GET_PLEX_SERVER_URL: (state, getters) => (getters.GET_PLEX_SERVER
    ? getters.GET_PLEX_SERVER.chosenConnection.uri
    : undefined),

  // eslint-disable-next-line no-nested-ternary
  GET_PLEX_SERVER_LOCATION: (state, getters) => (getters.GET_PLEX_SERVER
    ? getters.GET_PLEX_SERVER.publicAddressMatches === '1'
      ? 'lan'
      : 'wan'
    : undefined),

  GET_PART_ID: (state, getters, rootState, rootGetters) => (
    rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
      ? rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
        .Media[getters.GET_MEDIA_INDEX].Part[0].id
      : null),

  GET_DECISION_PART: (state, getters) => getters.GET_PLEX_DECISION?.MediaContainer
    ?.Metadata?.[0]?.Media?.[0].Part?.[0],

  IS_DECISION_DIRECT_PLAY: (state, getters) => getters.GET_DECISION_PART?.decision === 'directplay',

  GET_SRC_PATH: (state, getters) => (getters.IS_DECISION_DIRECT_PLAY
    ? getters.GET_DECISION_PART?.key
    : `/video/:/transcode/universal/start.${protocolExtension[getters.GET_STREAMING_PROTOCOL]}`),

  GET_SRC_URL: (state, getters) => makeUrl(
    `${getters.GET_PLEX_SERVER_URL}${getters.GET_SRC_PATH}`,
    getters.GET_DECISION_AND_START_PARAMS,
  ),

  GET_SUBTITLE_BASE_URL: (state, getters) => (getters.CAN_DIRECT_PLAY_SUBTITLES
    ? `${getters.GET_PLEX_SERVER_URL}${getters.GET_SUBTITLE_STREAM.key}`
    : `${getters.GET_PLEX_SERVER_URL}/video/:/transcode/universal/subtitles`),

  GET_DECISION_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL
  }/video/:/transcode/universal/decision`,

  GET_PART_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL
  }/library/parts/${getters.GET_PART_ID}`,

  GET_TIMELINE_URL: (state, getters) => `${getters.GET_PLEX_SERVER_URL}/:/timeline`,

  GET_PART: (state, getters, rootState, rootGetters) => rootGetters[
    'plexclients/GET_ACTIVE_MEDIA_METADATA']?.Media?.[getters.GET_MEDIA_INDEX]?.Part?.[0],

  GET_STREAMS: (state, getters) => getters.GET_PART?.Stream || [],

  GET_SELECTED_SUBTITLE_STREAM: (state, getters) => getters.GET_STREAMS
    ?.find(({ streamType, selected }) => streamType === 3 && selected),

  CAN_DIRECT_PLAY_SUBTITLES: (state, getters) => {
    if (!state.allowDirectPlay || getters.SHOULD_FORCE_BURN_SUBTITLES) {
      return false;
    }

    const { key, codec } = getters.GET_SELECTED_SUBTITLE_STREAM;
    // TODO: examine if I can only direct play with sidecar subtitles
    return key && (codec === 'srt' || codec === 'ass');
  },

  CAN_DIRECT_PLAY: (state, getters, rootState, rootGetters) => {
    if (!state.allowDirectPlay || getters.GET_FORCE_TRANSCODE) {
      return false;
    }

    if (!isContainerSupported(getters.GET_PART)) {
      console.log(`CAN_DIRECT_PLAY: container not supported: ${getters.GET_PART.container}`);
      return false;
    }

    const videoStream = getters.GET_STREAMS.find(({ streamType }) => streamType === 1);

    // If bitrate of file is higher than our limit, then we can't
    if (rootGetters['settings/GET_SLPLAYERQUALITY']
      && rootGetters['settings/GET_SLPLAYERQUALITY'] < videoStream?.bitrate) {
      console.debug('CAN_DIRECT_PLAY: false because video quality higher than desired');
      return false;
    }

    if (getters.GET_SELECTED_SUBTITLE_STREAM) {
      if (getters.SHOULD_FORCE_BURN_SUBTITLES) {
        console.debug('CAN_DIRECT_PLAY: false because subtitles are set to be burned');
        return false;
      }

      if (!getters.CAN_DIRECT_PLAY_SUBTITLES) {
        console.debug(
          'CAN_DIRECT_PLAY: false because subtitles enabled with incompatible codec or embedded',
        );
        return false;
      }
    }

    if (!isVideoSupported(videoStream)) {
      console.debug('CAN_DIRECT_PLAY: false video codec not supported');
      return false;
    }

    const audioStreams = getters.GET_STREAMS.filter(({ streamType }) => streamType === 2);
    const anyAudioSupported = audioStreams.some(isAudioSupported);

    if (audioStreams.length > 0 && !anyAudioSupported) {
      console.debug('CAN_DIRECT_PLAY: false audio codec not supported');
      return false;
    }

    console.debug('CAN_DIRECT_PLAY: true');
    return true;
  },

  GET_DECISION_STREAMS: (state, getters) => getters.GET_DECISION_PART?.Stream || [],

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

  GET_MEDIA_LIST: (state, getters, rootState, rootGetters) => (
    rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
      ? rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].Media.map(
        ({ videoResolution, bitrate }, index) => ({
          index,
          text: `${Math.round(bitrate / 100) / 10} Mbps, ${videoResolution}p`,
        }),
      ) : []),

  GET_QUALITIES: () => qualities,

  GET_AUDIO_STREAM_ID: (state, getters) => {
    const selectedAudioStream = getters.GET_DECISION_STREAMS
      .find((stream) => stream.streamType === 2 && stream.selected);
    return selectedAudioStream ? parseInt(selectedAudioStream.id, 10) : 0;
  },

  GET_SUBTITLE_STREAM: (state, getters) => getters.GET_DECISION_STREAMS
    .find((stream) => stream.streamType === 3 && stream.selected),

  GET_SUBTITLE_STREAM_ID: (state, getters) => (getters.GET_SUBTITLE_STREAM
    ? parseInt(getters.GET_SUBTITLE_STREAM.id, 10)
    : 0),

  GET_MEDIA_INDEX: (state) => state.mediaIndex,

  GET_RELATIVE_THUMB_URL: (state, getters, rootState, rootGetters) => (
    rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
      ? rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].grandparentThumb
      || rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].thumb
      : null),

  GET_THUMB_URL: (state, getters, rootState, rootGetters) => (getters.GET_PLEX_SERVER
    ? rootGetters['plexservers/GET_MEDIA_IMAGE_URL']({
      machineIdentifier: rootGetters['plexclients/GET_ACTIVE_SERVER_ID'],
      mediaUrl: getters.GET_RELATIVE_THUMB_URL,
      width: 200,
      height: 200,
    })
    : null),

  GET_OFFSET_MS: (state) => state.offsetMs,

  GET_PLAYER_STATE: (state) => state.playerState,

  GET_TITLE: (state, getters, rootState, rootGetters) => (
    rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
      ? contenttitleutils.getTitle(rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'])
      : null),

  GET_SECONDARY_TITLE: (state, getters, rootState, rootGetters) => (
    rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA']
      ? contenttitleutils.getSecondaryTitle(rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'])
      : null),

  GET_PART_PARAMS: (state, getters, rootState, rootGetters) => rootGetters[
    'plex/GET_PLEX_BASE_PARAMS'](getters.GET_PLEX_SERVER_ACCESS_TOKEN),

  GET_PLEX_PROFILE_EXTRAS: (state, getters, rootState, rootGetters) => {
    const base = 'append-transcode-target-codec('
      + `type=videoProfile&context=streaming&audioCodec=aac&protocol=${
        getters.GET_STREAMING_PROTOCOL})`;
    return rootGetters['settings/GET_SLPLAYERQUALITY']
      ? `${base
      }+add-limitation(scope=videoCodec&scopeName=*&type=upperBound&name=video.bitrate&value=${
        rootGetters['settings/GET_SLPLAYERQUALITY']}&replace=true)`
      : base;
  },

  SHOULD_FORCE_BURN_SUBTITLES: (state, getters) => getters.IS_IN_PICTURE_IN_PICTURE
    || state.forceBurnSubtitles,

  GET_SUBTITLE_PARAMS: (state, getters) => {
    if (!getters.GET_SELECTED_SUBTITLE_STREAM || getters.CAN_DIRECT_PLAY
      || getters.CAN_DIRECT_PLAY_SUBTITLES) {
      return {
        subtitles: 'none',
      };
    }

    if (getters.SHOULD_FORCE_BURN_SUBTITLES) {
      return {
        subtitles: 'burn',
      };
    }

    return {
      subtitles: 'auto',
      advancedSubtitles: 'text',
    };
  },

  GET_DECISION_AND_START_PARAMS: (state, getters, rootState, rootGetters) => ({
    hasMDE: 1,
    path: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].key,
    mediaIndex: getters.GET_MEDIA_INDEX,
    // TODO: investigate multipart file support
    partIndex: 0,
    protocol: getters.GET_STREAMING_PROTOCOL,
    fastSeek: 1,
    directPlay: getters.CAN_DIRECT_PLAY ? 1 : 0,
    directStream: getters.GET_FORCE_TRANSCODE ? 0 : 1,
    subtitleSize: 100,
    audioBoost: 100,
    location: getters.GET_PLEX_SERVER_LOCATION,
    // only include if not null
    ...rootGetters['settings/GET_SLPLAYERQUALITY'] && {
      maxVideoBitrate: rootGetters['settings/GET_SLPLAYERQUALITY'],
    },
    addDebugOverlay: 0,

    // TODO: figure out how to make autoAdjustQuality work
    autoAdjustQuality: 0,
    directStreamAudio: getters.GET_FORCE_TRANSCODE ? 0 : 1,
    mediaBufferSize: 102400, // ~100MB (same as what Plex Web uses)
    session: state.session,
    ...getters.GET_SUBTITLE_PARAMS,
    'Accept-Language': 'en',
    'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
    'X-Plex-Client-Profile-Extra': getters.GET_PLEX_PROFILE_EXTRAS,
    'X-Plex-Incomplete-Segments': 1,
    ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](getters.GET_PLEX_SERVER_ACCESS_TOKEN),
  }),

  ARE_PLAYER_CONTROLS_SHOWN: (state) => state.playerControlsShown,

  GET_X_PLEX_SESSION_ID: (state) => state.xplexsessionId,

  GET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN: (state) => state.plexTimelineUpdaterCancelToken,

  GET_PLAYER_DESTROY_CANCEL_TOKEN: (state) => state.playerDestroyCancelToken,

  GET_BUFFERING_EVENT_LISTENER: (state) => state.bufferingEventListener,

  GET_CLICK_EVENT_LISTENER: (state) => state.clickEventListener,

  GET_ERROR_EVENT_LISTENER: (state) => state.errorEventListener,

  IS_PLAYER_INITIALIZED: (state) => state.isPlayerInitialized,

  GET_PLAYER_INITIALIZED_DEFERRED_PROMISE: (state) => state.playerInitializedDeferredPromise,

  GET_MASK_PLAYER_STATE: (state) => state.maskPlayerState,

  IS_IN_PICTURE_IN_PICTURE: (state) => state.isInPictureInPicture,

  GET_ORIGINAL_SUBTITLE_RESOLUTION_X_CACHE: (state) => state.originalSubtitleResolutionXCache,

  GET_ORIGINAL_SUBTITLE_RESOLUTION_Y_CACHE: (state) => state.originalSubtitleResolutionYCache,

  GET_SUBTITLE_SIZE: (state) => state.subtitleSize,

  GET_SUBTITLE_POSITION: (state) => state.subtitlePosition,

  GET_SUBTITLE_COLOR: (state) => state.subtitleColor,

  IS_USING_NATIVE_SUBTITLES: (state, getters) => getters.GET_SUBTITLE_STREAM_ID
    && !getters.GET_SUBTITLE_STREAM?.burn,

  GET_SUBTITLE_OFFSET: (state) => state.subtitleOffset,

  IS_SUBTITLE_STREAM_NATIVE_SIDECAR: (state, getters) => getters.IS_USING_NATIVE_SUBTITLES
   && getters.GET_SUBTITLE_STREAM?.file,

  GET_FORCE_TRANSCODE_RETRY: (state) => state.forceTranscodeRetry,

  GET_FORCE_TRANSCODE: (state, getters, rootState, rootGetters) => getters.GET_FORCE_TRANSCODE_RETRY
    || rootGetters['settings/GET_SLPLAYERFORCETRANSCODE'],
};
