import guid from '@/utils/guid';

const state = () => ({
  session: null,
  xplexsessionId: guid(),

  plexDecision: null,

  mediaIndex: 0,

  offsetMs: 0,
  playerState: 'stopped',
  player: null,
  playerUi: null,
  playerControlsShown: true,
  playerControlsShownInterval: null,
  bufferingEventListener: null,
});

export default state;
