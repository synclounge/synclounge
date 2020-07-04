import Vue from 'vue';

export default {
  SET_USERS(state, value) {
    state.users = value;
  },

  SET_ROOM(state, value) {
    state.room = value;
  },

  SET_PASSWORD(state, value) {
    state.password = value;
  },

  SET_PARTYPAUSING(state, value) {
    state.partyPausing = value;
  },

  ADD_MESSAGE(state, msg) {
    state.messages.push(msg);
  },

  CLEAR_MESSAGES(state) {
    state.messages = [];
  },

  SET_RAW_TITLE(state, title) {
    state.rawTitle = title;
  },

  SET_SERVERS_HEALTH: (state, healths) => {
    state.serversHealth = healths;
  },

  SET_SOCKET: (state, socket) => {
    state.socket = socket;
  },

  INCREMENT_POLL_NUMBER: (state) => {
    state.pollNumber += 1;
  },

  UPDATE_SRTT: (state, rtt) => {
    const alpha = 0.125;

    if (state.srtt === null) {
      state.srtt = rtt;
    } else {
      state.srtt = (1 - alpha) * state.srtt + alpha * rtt;
    }
  },

  ADD_UNACKED_POLL: (state, { pollNumber, timeSent }) => {
    Vue.set(state.unackedPolls, pollNumber, timeSent);
  },

  DELETE_UNACKED_POLL: (state, pollNumber) => {
    Vue.delete(state.unackedPolls, pollNumber);
  },

  SET_SERVER: (state, server) => {
    state.server = server;
  },

  SET_HOST_TIMELINE: (state, timeline) => {
    state.hostTimeline = timeline;
  },

  SET_HOST_LAST_RATING_KEY: (state, ratingKey) => {
    state.hostLastRatingKey = ratingKey;
  },

  SET_IS_SYNC_IN_PROGRESS: (state, inProgress) => {
    state.isSyncInProgress = inProgress;
  },

  SET_IS_MANUAL_SYNC_QUEUED: (state, isQueued) => {
    state.isManualSyncQueued = isQueued;
  },

  SET_RECENT_ROOMS: (state, rooms) => {
    state.recentRooms = rooms;
  },

  SET_CLIENT_POLLER_CANCELER: (state, canceler) => {
    state.clientPollerCanceler = canceler;
  },

  SET_IS_IN_ROOM: (state, isInRoom) => {
    state.isInRoom = isInRoom;
  },

  SET_SOCKET_ID: (state, id) => {
    state.socketId = id;
  },

  SET_USER: (state, { id, data }) => {
    Vue.set(state.users, id, data);
  },

  SET_MESSAGES_USER_CACHE: (state, value) => {
    state.messagesUserCache = value;
  },

  SET_MESSAGES_USER_CACHE_USER: (state, { id, data }) => {
    Vue.set(state.messagesUserCache, id, data);
  },

  SET_HOST_ID: (state, hostId) => {
    state.hostId = hostId;
  },

  DELETE_USER: (state, id) => {
    Vue.delete(state.users, id);
  },
};
