
import generateGuid from '@/utils/guid';

const state = () => ({
  session: null,
  // TODO: find out why we need 2 session ids
  xplexsessionId: generateGuid(),

  ratingKey: null,
  metadata: null,
  plexDecision: null,
  plexServerId: null,

  mediaIndex: 0,
  maxVideoBitrate: null,

  offset: 0,
  playerState: 'buffering',
  player: null,
});


export default state;
