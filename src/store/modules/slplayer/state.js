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
});

export default state;
