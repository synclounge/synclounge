export default {
  GET_BACKGROUND: (state) => state.background,
  GET_UP_NEXT_TRIGGERED: (state) => state.upNextTriggered,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_CONFIG: (state) => state.configuration,
  GET_AUTHENTICATION: (state) => state.configuration.authentication,
  GET_CONFIGURATION_FETCHED: (state) => state.configurationFectched,
  GET_CONFIGURATION_FETCHED_ERROR: (state) => state.configurationFetchedError,
  GET_ACTIVE_METADATA: (state) => state.activeMetadata,
  GET_SNACKBAR_MESSAGE: (state) => state.snackbarMessage,
  GET_SNACKBAR_OPEN: (state) => state.snackbarOpen,
  GET_NAVIGATE_TO_PLAYER: (state) => state.navigateToPlayer,
};
