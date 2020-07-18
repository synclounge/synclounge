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

  DISPLAY_NOTIFICATION: ({ commit }, message) => {
    commit('SET_SNACKBAR_MESSAGE', message);
    commit('SET_SNACKBAR_OPEN', true);
  },
};
