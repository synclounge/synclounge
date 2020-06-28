import guid from '@/utils/guid';

// All of these settings are stored in localStorage and are persistent across reloads
const state = () => ({
  autoplay: null,
  clientPollInterval: 1000,
  syncMode: 'cleanseek',
  syncFlexibility: 3000,
  customServer: {
    name: 'Custom Server',
    location: 'Anywhere!',
    url: 'custom',
    image: 'synclounge-white.png',
  },
  customServerUserInputtedUrl: 'http://',
  slPlayerQuality: null,
  slPlayerVolume: 1,
  slPlayerForceTranscode: null,
  hideUsername: false,
  altUsername: null,
  clientIdentifier: guid(),
  plexAuthToken: null,
});

export default state;
