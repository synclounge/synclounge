import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import actions from './actions';
import state from './state';
import mutations from './mutations';
import getters from './getters';

import synclounge from './modules/synclounge';
import config from './modules/config/config.store';
import settings from './modules/settings';
import plex from './modules/plex';
import slplayer from './modules/slplayer';

Vue.use(Vuex);

const persistedState = createPersistedState({
  paths: [
    'settings',
    'plex.user',
    'plex.userAuthorized',
  ],
});

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
  modules: {
    synclounge,
    plex,
    config,
    settings,
    slplayer,
  },
  plugins: [persistedState],
});

export default store;
