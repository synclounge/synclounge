
import Vue from 'vue';
import VueScrollTo from 'vue-scrollto';
import Vuetify from 'vuetify';
import { ObserveVisibility } from 'vue-observe-visibility/dist/vue-observe-visibility';
import VueVideoPlayer from 'vue-video-player';
import VueResource from 'vue-resource';
import VueClipboards from 'vue-clipboards';
import VueCookies from 'vue-cookies'

import App from './App';
import router from './router';
import store from './store';

require('videojs-contrib-hls/dist/videojs-contrib-hls.js');
require('vanilla-tilt');

const moment = require('moment');

Vue.use(VueScrollTo);
Vue.use(VueClipboards);
Vue.use(VueResource);
Vue.directive('observe-visibility', ObserveVisibility);
Vue.use(VueVideoPlayer);

Vue.use(Vuetify, {
  theme: {
    primary: '#E5A00D',
    secondary: '#b0bec5',
    accent: '#8c9eff',
    error: '#b71c1c',
  },
});
Vue.config.productionTip = false;

Vue.use(VueCookies);
// set default config
Vue.$cookies.config('7d');

function nolog() {}

if (process.env.NODE_ENV !== 'development') {
  // console.log = nolog
  // console.warn = nolog
  // console.error = nolog
}

// Our Event bus
window.EventBus = new Vue();
window.EventBus.$on('command', (data) => {
  if (data.command === '/player/timeline/poll') {
    if (router.app.route.fullPath.indexOf('/player') === -1) {
      return data.callback({
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
  if (data.command === '/player/playback/playMedia') {
    router.push({
      path: '/player',
      query: {
        start: true,
        key: data.params.key.replace('/library/metadata/', ''),
        mediaIndex: data.params.mediaIndex || 0,
        chosenServer: data.params.machineIdentifier,
        playertime: data.params.offset,
      },
    });
    return data.callback(true);
  }
});

Vue.mixin({
  methods: {
    sinceNow(x) {
      const time = moment(x);
      return time.fromNow();
    },
  },
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
      const w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
      const maxPx = 94;
      const maxRes = 3000;
      return {
        largest: {
          'font-size': `${(w / maxRes) * maxPx}px`,
        },
        medium: {
          'font-size': `${((w / maxRes) * maxPx) * 0.6}px`,
        },
      };
    },
  },
});

router.beforeEach((to, from, next) => {
  // console.log('Route change', to, this, store)
  if (to.matched.some(record => record.meta.protected)) {
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
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {
    App,
  },
});

global.waitFor = async ms => new Promise((resolve) => {
  setTimeout(() => resolve, ms);
});

global.to = promise => promise.then(data => [null, data])
  .catch(err => [err]);
