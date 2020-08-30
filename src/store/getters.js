export default {
  GET_VERSION: (state) => state.version,
  GET_GIT_HASH: (state) => state.gitHash,
  GET_REPOSITORY_URL: (state) => state.repositoryUrl,
  GET_DISCORD_URL: (state) => state.discordUrl,
  GET_RELEASE_URL: (state, getters) => `${getters.GET_REPOSITORY_URL}/releases/tag/v${
    getters.GET_VERSION}`,
  GET_COMMIT_URL: (state, getters) => `${getters.GET_REPOSITORY_URL}/commit/${
    getters.GET_GIT_HASH}`,
  GET_BACKGROUND: (state) => state.background,
  GET_UP_NEXT_POST_PLAY_DATA: (state) => state.upNextPostPlayData,
  GET_CONFIG: (state) => state.configuration,
  GET_ACTIVE_METADATA: (state) => state.activeMetadata,
  GET_SNACKBAR_MESSAGE: (state) => state.snackbarMessage,
  GET_SNACKBAR_OPEN: (state) => state.snackbarOpen,
  GET_NAVIGATE_TO_PLAYER: (state) => state.navigateToPlayer,
  GET_BROWSER: (state) => state.browser,
};
