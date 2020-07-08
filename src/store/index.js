import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import playerUiPlugins from '@/player/ui';
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
    'plexservers.blockedServerIds',
    'synclounge.recentRooms',
  ],
});

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state,
  mutations,
  actions,
  getters,
  modules,
  plugins: [
    persistedState,
    playerUiPlugins,
  ],
});

export default store;
