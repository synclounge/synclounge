import { format } from 'date-fns';

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
    state.messages.push({
      ...msg,
      time: format(new Date(), 'h:mm a..aaa'),
    });
  },

  CLEAR_MESSAGES(state) {
    state.messages = [];
  },

  SET_RAW_TITLE(state, title) {
    state.rawTitle = title;
  },

  SET_DECISION_BLOCKED_TIME(state, time) {
    state.decisionBlockedTime = time;
  },

  SET_SERVERS_HEALTH: (state, healths) => {
    state.serversHealth = healths;
  },

  SET_SOCKET: (state, socket) => {
    state.socket = socket;
  },
};
