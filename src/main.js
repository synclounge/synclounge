import Vue from 'vue';
import VueClipboard from 'vue-clipboard2';
import VueChatScroll from 'vue-chat-scroll';

import vuetify from './plugins/vuetify';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.use(VueChatScroll);
Vue.use(VueClipboard);

Vue.config.productionTip = false;

router.beforeEach((to, from, next) => {
  if (!store.getters['plex/IS_AUTHENTICATED'] && to.matched.some((record) => record.meta.requiresAuth)) {
    if (to.matched.some((record) => record.meta.redirectAfterAuth)) {
      next({
        name: 'Signin',
        query: {
          redirect: to.fullPath,
        },
      });
    } else {
      next({ name: 'Signin' });
    }
  } else if (to.matched.some((record) => record.meta.requiresNoAuth) && store.getters['plex/IS_AUTHENTICATED']) {
    next({ name: 'CreateRoom' });
  } else if (!store.getters['synclounge/IS_IN_ROOM'] && to.matched.some((record) => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage
    next({ name: 'CreateRoom' });
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
