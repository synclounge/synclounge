import guid from '@/utils/guid';

// The state must return a function
// to make the module reusable.
// See: https://vuex.vuejs.org/en/modules.html#module-reuse
// All of these settings are stored in localStorage and are persistent across reloads
const state = () => ({
  autoplay: null,
  clientPollInterval: null,
  syncMode: null,
  syncFlexibility: null,
  customServer: {
    name: 'Custom Server',
    location: 'Anywhere!',
    url: 'custom',
    image: 'synclounge-white.png',
  },
  customServerUserInputtedUrl: 'http://',
  slPlayerQuality: null,
  slPlayerVolume: null,
  slPlayerForceTranscode: null,
  hideUsername: false,
  altUsername: null,
  clientIdentifier: guid(),
  plexAuthToken: null,
  recentRooms: [],
});

export default state;
