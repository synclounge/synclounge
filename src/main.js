import Vue from 'vue';
import VueScrollTo from 'vue-scrollto';
import VueObserveVisibility from 'vue-observe-visibility';
import VueClipboard from 'vue-clipboard2';
import { sync } from 'vuex-router-sync';

import vuetify from './plugins/vuetify';

import App from './App.vue';
import router from './router';
import store from './store';

sync(store, router);

Vue.use(VueScrollTo);
Vue.use(VueClipboard);
Vue.use(VueObserveVisibility);

Vue.config.productionTip = false;

// Our Event bus
window.EventBus = new Vue();
window.EventBus.$on('command', (data) => {
  // eslint-disable-next-line no-underscore-dangle
  if (router.app._route.fullPath.indexOf('/player') === -1) {
    if (data.command === '/player/timeline/poll') {
      data.callback({
        key: null,
        ratingKey: null,
        time: 0,
        type: 'video',
        machineIdentifier: null,
        duration: 0,
        state: 'stopped',
      });
    } else if (data.command === '/player/playback/playMedia') {
      router.push({
        path: '/player',
        query: {
          key: data.params.key,
          mediaIndex: data.params.mediaIndex,
          machineIdentifier: data.params.machineIdentifier,
          offset: data.params.offset,
        },
      });

      data.callback(true);
    }
  }
});

router.beforeEach((to, from, next) => {
  // console.log('Route change', to, this, store)
  if (to.matched.some((record) => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage
    if (!store.getters.getChosenClient) {
      return next({
        path: '/clientselect',
      });
    }
    if (!store.getters.getRoom) {
      return next({
        path: '/joinroom',
      });
    }
    if (!store.getters.getServer) {
      return next({
        path: '/joinroom',
      });
    }
    next();
  } else {
    if (!to.meta.protected) {
      return next();
    }
    router.push('/browse');
  }

  return null;
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
