import Vue from 'vue';
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
};
