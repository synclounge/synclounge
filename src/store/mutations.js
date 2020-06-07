import Vue from 'vue';

export default {
  SET_CHOSENCLIENT(state, client) {
    state.chosenClient = client;
  },
  SET_PLEX(state, value) {
    state.plex = value;
  },
  SET_AUTOJOIN(state, value) {
    state.autoJoin = value;
  },
  SET_BACKGROUND(state, value) {
    state.background = value;
  },
  SET_AUTOJOINROOM(state, value) {
    state.autoJoinRoom = value;
  },
  SET_AUTOJOINPASSWORD(state, value) {
    state.autoJoinPassword = value;
  },
  SET_AUTOJOINURL(state, value) {
    state.autoJoinUrl = value;
  },
  SET_SHORTLINK(state, value) {
    state.shortLink = value;
  },
  REFRESH_PLEXDEVICES(state) {
    state.plex.getDevices(() => {});
  },

  SET_VALUE(state, data) {
    const [key, value] = data;
    Vue.set(state, key, value);
  },
  SET_LEFT_SIDEBAR_OPEN: (state, open) => { state.isLeftSidebarOpen = open; },
  SET_RIGHT_SIDEBAR_OPEN: (state, open) => { state.isRightSidebarOpen = open; },
  TOGGLE_RIGHT_SIDEBAR_OPEN: (state) => { state.isRightSidebarOpen = !state.isRightSidebarOpen; },
  SET_BLOCK_AUTOPLAY: (state, block) => {
    state.blockAutoPlay = block;
  },

  SET_MANUAL_SYNC_QUEUED: (state, queued) => {
    state.manualSyncQueued = queued;
  },

  SET_UP_NEXT_TRIGGERED: (state, triggered) => {
    state.upNextTriggered = triggered;
  },

  SET_UP_NEXT_POST_PLAY_DATA: (state, data) => {
    state.upNextPostPlayData = data;
  },

  SET_PLEX_SERVER_ID: (state, id) => {
    state.plexServerId = id;
  },
};
