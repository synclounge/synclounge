import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import actions from './actions';
import state from './state';
import mutations from './mutations';
import getters from './getters';
import modules from './modules';

Vue.use(Vuex);

const persistedState = createPersistedState({
  paths: [
    'settings',
    'plex.user',
    'plexservers.lastServerId',
  ],
});

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules,
  plugins: [persistedState],
});

export default store;
