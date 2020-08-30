import { fetchJson } from '@/utils/fetchutils';

export default {
  RESET: ({ commit }) => {
    commit('RESET');
    commit('plex/RESET');
    commit('plexclients/RESET');
    commit('plexservers/RESET');
    commit('settings/RESET');
    commit('slplayer/RESET');
    commit('synclounge/RESET');
  },

  SET_LEFT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_LEFT_SIDEBAR_OPEN', open);
  },

  SET_RIGHT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_RIGHT_SIDEBAR_OPEN', open);
  },

  TOGGLE_RIGHT_SIDEBAR_OPEN: ({ commit }) => {
    commit('TOGGLE_RIGHT_SIDEBAR_OPEN');
  },

  DISPLAY_NOTIFICATION: ({ commit }, message) => {
    commit('SET_SNACKBAR_MESSAGE', message);
    commit('SET_SNACKBAR_OPEN', true);
  },

  FETCH_CONFIG: async ({ commit }) => {
    const config = await fetchJson('config.json');

    commit('SET_CONFIGURATION', config);
  },
};
