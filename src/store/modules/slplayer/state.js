import guid from '@/utils/guid';

const state = () => ({
  session: null,
  xplexsessionId: guid(),
  plexDecision: null,
  mediaIndex: 0,
  offsetMs: 0,
  playerState: 'stopped',
  playerControlsShown: true,
  playerControlsShownInterval: null,
  bufferingEventListener: null,
  clickEventListener: null,
  plexTimelineUpdaterCanceler: null,
  isPlayerInitialized: false,
  playerInitializedPromiseResolver: null,

  // This is used to signal whether to mask the player state (time, etc) when sending updates
  // before the media is loaded
  maskPlayerState: false,
  isInPictureInPicture: false,
});

export default state;
