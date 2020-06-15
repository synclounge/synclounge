import guid from '@/utils/guid';

const state = () => ({
  session: null,
  xplexsessionId: guid(),

  key: null,
  metadata: null,
  plexDecision: null,
  plexServerId: null,

  mediaIndex: 0,

  offsetMs: 0,
  playerState: 'buffering',
  player: null,
  playerUi: null,
  playerControlsShown: true,
  playerControlsShownInterval: null,
  bufferingEventListener: null,
});

export default state;
