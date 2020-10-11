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
  altUsername: null,
  autoSkipIntro: null,
});

export default state;
