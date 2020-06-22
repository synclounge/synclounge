import axios from 'axios';

export default {
  SET_LEFT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_LEFT_SIDEBAR_OPEN', open);
  },

  SET_RIGHT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_RIGHT_SIDEBAR_OPEN', open);
  },

  TOGGLE_RIGHT_SIDEBAR_OPEN: ({ commit }) => {
    commit('TOGGLE_RIGHT_SIDEBAR_OPEN');
  },

  TRIGGER_MANUAL_SYNC: ({ commit }) => {
    commit('SET_MANUAL_SYNC_QUEUED', true);
  },

  FETCH_CONFIG: async ({ commit }) => {
    const url = window.location.origin + window.location.pathname.replace(/\/+$/, '');
    try {
      const { data } = await axios.get(`${url}/config`);
      commit('SET_CONFIG', data);
    } catch (e) {
      commit('SET_CONFIGURATION_FETCH_ERROR', e);
    }

    commit('SET_CONFIGURATION_FETCHED', true);
  },

  DISPLAY_NOTIFICATION: ({ commit }, message) => {
    commit('SET_SNACKBAR_MESSAGE', message);
    commit('SET_SNACKBAR_OPEN', true);
  },
};
