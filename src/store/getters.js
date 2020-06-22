export default {
  getAppVersion: (state) => state.appVersion,
  getBackground: (state) => state.background,

  getLogos: () => ({
    light: {
      long: 'logo-long-light.png',
      small: 'logo-small-light.png',
    },
    dark: {
      long: 'logo-long-dark.png',
    },
    plex: {
      standard: 'plexlogo.png',
    },
  }),

  GET_MANUAL_SYNC_QUEUED: (state) => state.manualSyncQueued,

  GET_UP_NEXT_TRIGGERED: (state) => state.upNextTriggered,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_CONFIG: (state) => state.configuration,
  GET_AUTHENTICATION: (state) => state.configuration.authentication,
  GET_CONFIGURATION_FETCHED: (state) => state.configurationFectched,
  GET_CONFIGURATION_FETCHED_ERROR: (state) => state.configurationFetchedError,
  GET_ACTIVE_METADATA: (state) => state.activeMetadata,
};
