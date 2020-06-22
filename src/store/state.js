const state = () => ({
  appTitle: 'SyncLounge',
  appVersion: process.env.VUE_APP_VERSION,
  background: null,
  manualSyncQueued: false,
  upNextCache: {},
  configuration: JSON.parse(process.env.VUE_APP_CONFIGURATION),
  configurationFetched: false,
  configurationFetchError: false,

  isLeftSidebarOpen: false,
  isRightSidebarOpen: false,

  // This tracks whether the upnext screen was triggered for this playback already.
  // It is reset to false when the player gets out of the upNext time zone (at the end of episode)
  upNextTriggered: false,

  // This stores the postplay data and controls whether the upnext component is visible
  upNextPostPlayData: null,

  // Used to help with the crumbs
  activeMetadata: null,
});

export default state;
