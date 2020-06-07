import Vue from 'vue';
import VueScrollTo from 'vue-scrollto';
import VueObserveVisibility from 'vue-observe-visibility';
import VueClipboard from 'vue-clipboard2';
import VueCookies from 'vue-cookies';
import moment from 'moment';
import { sync } from 'vuex-router-sync';

import vuetify from './plugins/vuetify';

import App from './App.vue';
import router from './router';
import store from './store';

require('vanilla-tilt');


sync(store, router);

Vue.use(VueScrollTo);
Vue.use(VueClipboard);
Vue.use(VueObserveVisibility);

Vue.config.productionTip = false;

Vue.use(VueCookies);
// set default config
Vue.$cookies.config('7d');

// Our Event bus
window.EventBus = new Vue();
window.EventBus.$on('command', (data) => {
  if (router.app.route.fullPath.indexOf('/player') === -1) {
    if (data.command === '/player/timeline/poll') {
      return data.callback({
        key: null,
        ratingKey: null,
        time: 0,
        type: 'video',
        machineIdentifier: null,
        duration: 0,
        state: 'stopped',
      });
    } if (data.command === '/player/playback/playMedia') {
      router.push({
        path: '/player',
        query: {
          key: data.params.key,
          mediaIndex: data.params.mediaIndex,
          machineIdentifier: data.params.machineIdentifier,
          offset: data.params.offset,
        },
      });
      return data.callback(true);
    }
  }
});

Vue.mixin({
  computed: {
    appVersion() {
      return this.$store.getters.appVersion;
    },
    logos() {
      return this.$store.getters.getLogos;
    },
    slConnected() {
      return this.$store.getters.getConnected;
    },
    slServer() {
      return this.$store.getters.getServer;
    },
    slRoom() {
      return this.$store.getters.getRoom;
    },
    slPassword() {
      return this.$store.getters.getPassword;
    },
    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
    plex() {
      return this.$store.getters.getPlex;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    plexserver() {
      return this.plex.servers[this.$route.params.machineIdentifier];
    },
    route() {
      return this.$route;
    },
    fontSizes() {
      const w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      );
      const maxPx = 94;
      const maxRes = 3000;
      return {
        largest: {
          'font-size': `${(w / maxRes) * maxPx}px`,
        },
        medium: {
          'font-size': `${(w / maxRes) * maxPx * 0.6}px`,
        },
      };
    },
  },
  methods: {
    sinceNow(x) {
      const time = moment(x);
      return time.fromNow();
    },
  },
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
