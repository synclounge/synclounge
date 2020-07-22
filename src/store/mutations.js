export default {
  SET_BACKGROUND(state, value) {
    state.background = value;
  },

  SET_LEFT_SIDEBAR_OPEN: (state, open) => { state.isLeftSidebarOpen = open; },
  SET_RIGHT_SIDEBAR_OPEN: (state, open) => { state.isRightSidebarOpen = open; },
  TOGGLE_RIGHT_SIDEBAR_OPEN: (state) => { state.isRightSidebarOpen = !state.isRightSidebarOpen; },

  SET_UP_NEXT_TRIGGERED: (state, triggered) => {
    state.upNextTriggered = triggered;
  },

  SET_UP_NEXT_POST_PLAY_DATA: (state, data) => {
    state.upNextPostPlayData = data;
  },

  SET_ACTIVE_METADATA: (state, metadata) => {
    state.activeMetadata = metadata;
  },

  SET_SNACKBAR_MESSAGE: (state, message) => {
    state.snackbarMessage = message;
  },

  SET_SNACKBAR_OPEN: (state, open) => {
    state.snackbarOpen = open;
  },

  SET_NAVIGATE_TO_PLAYER: (state, navigate) => {
    state.navigateToPlayer = navigate;
  },

  SET_CONFIGURATION: (state, configuration) => {
    state.configuration = configuration;
  },

  SET_CONFIGURATION_PROMISE: (state, promise) => {
    state.configurationPromise = promise;
  },
};
