import Vue from 'vue';
import VueChatScroll from 'vue-chat-scroll';

import vuetify from './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(VueChatScroll);

Vue.config.errorHandler = (err) => {
  store.dispatch('DISPLAY_NOTIFICATION', {
    text: err.message,
    color: 'error',
  });

  console.error(err);
};

router.beforeEach(async (to, from, next) => {
  if (!store.getters.GET_CONFIG) {
    await store.dispatch('FETCH_CONFIG');
  }

  if ((store.getters['plex/IS_UNAUTHORIZED']
    && to.matched.some((record) => record.meta.requiresAuth))
  || (!store.getters['plex/GET_PLEX_AUTH_TOKEN']
    && to.matched.some((record) => record.meta.requiresPlexToken))) {
    if (to.matched.some((record) => record.meta.redirectAfterAuth)) {
      next({
        name: 'SignIn',
        query: {
          redirect: to.fullPath,
        },
      });
    } else {
      next({ name: 'SignIn' });
    }
  } else if (to.matched.some((record) => record.meta.requiresNoAuth)
    && store.getters['plex/GET_PLEX_AUTH_TOKEN']) {
    next({ name: 'RoomCreation' });
  } else if (!store.getters['synclounge/IS_IN_ROOM']
    && to.matched.some((record) => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage
    next({ name: 'RoomCreation' });
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
