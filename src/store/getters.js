export default {
  GET_RELEASE_URL: (state) => `${state.repositoryUrl}/releases/tag/v${state.version}`,
  GET_BACKGROUND: (state) => state.background,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_CONFIG: (state) => state.configuration,
  GET_ACTIVE_METADATA: (state) => state.activeMetadata,
  GET_SNACKBAR_MESSAGE: (state) => state.snackbarMessage,
  GET_SNACKBAR_OPEN: (state) => state.snackbarOpen,
  GET_NAVIGATE_TO_PLAYER: (state) => state.navigateToPlayer,
  GET_BROWSER: (state) => state.browser,
  GET_NAVIGATE_HOME: (state) => state.navigateHome,
  IS_LIBRARY_LIST_VIEW: (state) => state.isLibraryListView,
};
