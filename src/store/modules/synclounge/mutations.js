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

  SET_IS_PARTY_PAUSING_ENABLED(state, isEnabled) {
    state.isPartyPausingEnabled = isEnabled;
  },

  ADD_MESSAGE(state, msg) {
    state.messages.push(msg);
  },

  CLEAR_MESSAGES(state) {
    state.messages = [];
  },

  SET_SERVERS_HEALTH: (state, healths) => {
    state.serversHealth = healths;
  },

  SET_SERVER: (state, server) => {
    state.server = server;
  },

  SET_SYNC_CANCEL_TOKEN: (state, token) => {
    state.syncCancelToken = token;
  },

  SET_RECENT_ROOMS: (state, rooms) => {
    state.recentRooms = rooms;
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

  SET_USER_PLAYER_STATE: (state, {
    id, state: playerState, time, duration, playbackRate,
  }) => {
    Vue.set(state.users[id], 'state', playerState);
    Vue.set(state.users[id], 'time', time);
    Vue.set(state.users[id], 'duration', duration);
    Vue.set(state.users[id], 'playbackRate', playbackRate);
    Vue.set(state.users[id], 'updatedAt', Date.now());
  },

  SET_USER_MEDIA: (state, { id, media }) => {
    Vue.set(state.users[id], 'media', media);
  },

  SET_USER_SYNC_FLEXIBILITY: (state, { id, syncFlexibility }) => {
    Vue.set(state.users[id], 'syncFlexibility', syncFlexibility);
  },

  SET_UPNEXT_TIMEOUT_ID: (state, id) => {
    state.upnextTimeoutId = id;
  },

  SET_UP_NEXT_TRIGGERED: (state, triggered) => {
    state.upNextTriggered = triggered;
  },

  SET_ARE_NOTIFICATIONS_ENABLED: (state, enabled) => {
    state.areNotificationsEnabled = enabled;
  },

  SET_ARE_SOUND_NOTIFICATIONS_ENABLED: (state, enabled) => {
    state.areSoundNotificationsEnabled = enabled;
  },
};
