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

  DISPLAY_NOTIFICATION: ({ commit }, message) => {
    commit('SET_SNACKBAR_MESSAGE', message);
    commit('SET_SNACKBAR_OPEN', true);
  },

  FETCH_CONFIG: async ({ dispatch, commit }) => {
    try {
      const config = await fetchJson('config.json');
      commit('SET_CONFIGURATION', config);
    } catch (e) {
      console.error(e);
      await dispatch('DISPLAY_NOTIFICATION', {
        text: 'Error fetching config',
        color: 'error',
      });
    }
  },

  NAVIGATE_HOME: async ({ getters, commit }) => {
    if (!getters.GET_NAVIGATE_HOME) {
      commit('SET_NAVIGATE_HOME', true);
    }
  },
};
