import Vue from 'vue';
import stateFactory from './state';

export default {
  RESET: (state) => {
    Object.assign(state, stateFactory());
  },

  SET_LAST_SERVER_ID: (state, id) => {
    state.lastServerId = id;
  },

  ADD_PLEX_SERVER: (state, server) => {
    Vue.set(state.servers, server.clientIdentifier, server);
  },

  DELETE_PLEX_SERVER: (state, serverId) => {
    Vue.delete(state.servers, serverId);
  },

  SET_BLOCKED_SERVER_IDS: (state, blockedIds) => {
    state.blockedServerIds = blockedIds;
  },
};
