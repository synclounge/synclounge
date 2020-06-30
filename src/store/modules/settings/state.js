import guid from '@/utils/guid';

// All of these settings are stored in localStorage and are persistent across reloads
const state = () => ({
  autoplay: null,
  clientPollInterval: null,
  syncMode: null,
  syncFlexibility: null,
  customServerUserInputtedUrl: 'http://',
  slPlayerQuality: null,
  slPlayerVolume: null,
  slPlayerForceTranscode: null,
  hideUsername: false,
  altUsername: null,
  clientIdentifier: guid(),
  plexAuthToken: null,
});

export default state;
