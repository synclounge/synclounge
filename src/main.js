import Vue from 'vue';
import VueObserveVisibility from 'vue-observe-visibility';
import VueClipboard from 'vue-clipboard2';
import VueChatScroll from 'vue-chat-scroll';

import vuetify from './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(VueChatScroll);
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
    }
  }
});

router.beforeEach((to, from, next) => {
  if (!store.getters['plex/IS_AUTHENTICATED'] && to.matched.some((record) => record.meta.requiresAuth)) {
    if (to.matched.some((record) => record.meta.redirectAfterAuth)) {
      next({
        path: '/signin',
        query: {
          redirect: to.fullPath,
        },
      });
    } else {
      next('/signin');
    }
  } else if (to.matched.some((record) => record.meta.requiresNoAuth) && store.getters['plex/IS_AUTHENTICATED']) {
    next('/');
  } else if (store.getters.GET_CONFIG.autoJoin
    && to.matched.some((record) => record.meta.noAutoJoin)) {
    next('/autojoin');
  } else if (store.getters.GET_CONFIG.autoJoin
    && to.matched.some((record) => record.meta.requiresAutoJoinEnabled)) {
    next('/');
  } else if (!store.getters.getRoom && to.matched.some((record) => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage

    next('/');
  } else {
    next();
  }
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
