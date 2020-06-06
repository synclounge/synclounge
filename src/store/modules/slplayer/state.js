
import generateGuid from '@/utils/guid';

const state = () => ({
  session: null,
  xplexsessionId: generateGuid(),

  // Make persistent
  xPlexClientIdentifier: generateGuid(),

  key: null,
  metadata: null,
  plexDecision: null,
  plexServerId: null,

  mediaIndex: 0,
  maxVideoBitrate: null,

  offsetMs: 0,
  playerState: 'buffering',
  player: null,
  playerUi: null,
  playerControlsShown: true,
  playerControlsShownInterval: null,

  // This tracks whether the latest pause was locally or remotely originated.
  // This is used to track whether to send out a party pause or not.
  userTriggeredPause: false,

  // Tracks whether the play event was triggered by the user.
  // This exists since it's very hard to actually get an event from shaka player for the
  // user triggering a play or pause event.
  userTriggeredPlay: false,

  bufferingEventListener: null,
});


export default state;
