export default {
  SET_BACKGROUND(state, value) {
    state.background = value;
  },

  SET_LEFT_SIDEBAR_OPEN: (state, open) => { state.isLeftSidebarOpen = open; },
  SET_RIGHT_SIDEBAR_OPEN: (state, open) => { state.isRightSidebarOpen = open; },
  TOGGLE_RIGHT_SIDEBAR_OPEN: (state) => { state.isRightSidebarOpen = !state.isRightSidebarOpen; },

  SET_MANUAL_SYNC_QUEUED: (state, queued) => {
    state.manualSyncQueued = queued;
  },

  SET_UP_NEXT_TRIGGERED: (state, triggered) => {
    state.upNextTriggered = triggered;
  },

  SET_UP_NEXT_POST_PLAY_DATA: (state, data) => {
    state.upNextPostPlayData = data;
  },

  SET_CONFIG: (state, data) => {
    state.configuration = data;
  },

  SET_CONFIGURATION_FETCHED: (state, fetched) => {
    state.configurationFetcehd = fetched;
  },

  SET_CONFIGURATION_FETCH_ERROR: (state, error) => {
    state.configurationFetchError = error;
  },
};
