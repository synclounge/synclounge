
import generateGuid from '@/utils/guid';

const state = () => ({
  session: null,
  xplexsessionId: generateGuid(),

  // Make persistent
  xPlexClientIdentifier: generateGuid(),

  ratingKey: null,
  metadata: null,
  plexDecision: null,
  plexServerId: null,

  mediaIndex: 0,
  maxVideoBitrate: null,

  offsetMs: 0,
  playerState: 'buffering',
  player: null,
  playerUi: null,
});


export default state;
