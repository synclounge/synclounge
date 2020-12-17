import { getRandomPlexId } from '@/utils/random';
import { subtitlePositions, subtitleSizes, subtitleColors } from '@/utils/subtitleutils';

const state = () => ({
  session: null,
  xplexsessionId: getRandomPlexId(),
  plexDecision: null,
  mediaIndex: 0,
  offsetMs: 0,
  playerState: 'stopped',
  playerControlsShown: false,
  playerControlsShownInterval: null,
  bufferingEventListener: null,
  clickEventListener: null,
  errorEventListener: null,
  plexTimelineUpdaterCancelToken: null,
  playerDestroyCancelToken: null,
  isPlayerInitialized: false,
  playerInitializedDeferredPromise: null,

  // This is used to signal whether to mask the player state (time, etc) when sending updates
  // before the media is loaded
  maskPlayerState: false,
  isInPictureInPicture: false,

  // Subtitle state
  originalSubtitleResolutionXCache: null,
  originalSubtitleResolutionYCache: null,

  subtitleSize: subtitleSizes.Normal,
  subtitlePosition: subtitlePositions.Bottom,
  subtitleColor: subtitleColors.White,
  subtitleOffset: 0,
  streamingProtocol: 'dash',
  forceTranscodeRetry: false,
  forceBurnSubtitles: false,
  allowDirectPlay: true,
});

export default state;
