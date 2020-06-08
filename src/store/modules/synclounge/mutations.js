import { format } from 'date-fns';

export default {
  SET_CONNECTED(state, value) {
    state.connected = value;
  },
  SET_ME(state, value) {
    state.me = value;
  },
  SET_USERS(state, value) {
    state.users = value;
  },
  SET_ROOM(state, value) {
    state.room = value;
  },
  SET_PASSWORD(state, value) {
    state.password = value;
  },
  SET_SERVERS(state, value) {
    state.servers = value;
  },
  SET_SERVER(state, value) {
    state.server = value;
  },
  SET_PARTYPAUSING(state, value) {
    state.partyPausing = value;
  },
  ADD_MESSAGE(state, msg) {
    state.messages.push({
      ...msg,
      time: format(new Date()),
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
};
