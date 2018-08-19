import '@babel/polyfill'

import Vue from 'vue'
import './plugins/vuetify'
import VueScrollTo from 'vue-scrollto'
import VueVideoPlayer from 'vue-video-player'
import VueObserveVisibility from 'vue-observe-visibility'
import 'video.js/dist/video-js.css'
import VueClipboards from 'vue-clipboards'

import App from './App'
import router from './router'
import store from './store'

require('videojs-contrib-hls')
require('vanilla-tilt')

var moment = require('moment')

Vue.use(VueScrollTo)
Vue.use(VueClipboards)
Vue.use(VueVideoPlayer)
Vue.use(VueObserveVisibility)

Vue.config.productionTip = false

if (process.env.NODE_ENV !== 'development') {
  // console.log = nolog
  // console.warn = nolog
  // console.error = nolog
}

// Our Event bus
window.EventBus = new Vue()
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
        state: 'stopped'
      })
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
        playertime: data.params.offset
      }
    })
    return data.callback(true)
  }
})

Vue.mixin({
  methods: {
    sinceNow: function (x) {
      let time = moment(x)
      return time.fromNow()
    }
  },
  computed: {
    appVersion: function () {
      return this.$store.getters.appVersion
    },
    logos: function () {
      return this.$store.getters.getLogos
    },
    slConnected: function () {
      return this.$store.getters.getConnected
    },
    slServer: function () {
      return this.$store.getters.getServer
    },
    slRoom: function () {
      return this.$store.getters.getRoom
    },
    slPassword: function () {
      return this.$store.getters.getPassword
    },
    chosenClient: function () {
      return this.$store.getters.getChosenClient
    },
    plex: function () {
      return this.$store.getters.getPlex
    },
    settings: function () {
      return this.$store.getters.getSettings
    },
    plexserver: function () {
      return this.plex.servers[this.$route.params.machineIdentifier]
    },
    route: function () {
      return this.$route
    },
    fontSizes: function () {
      var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0))
      let maxPx = 94
      let maxRes = 3000
      return {
        largest: {
          'font-size': ((w / maxRes) * maxPx) + 'px'
        },
        medium: {
          'font-size': ((w / maxRes) * maxPx) * 0.6 + 'px'
        }
      }
    }
  }
})

router.beforeEach((to, from, next) => {
  // console.log('Route change', to, this, store)
  if (to.matched.some(record => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage
    if (!store.getters.getChosenClient) {
      return next({
        path: '/clientselect'
      })
    }
    if (!store.getters.getRoom) {
      return next({
        path: '/joinroom'
      })
    }
    if (!store.getters.getServer) {
      return next({
        path: '/joinroom'
      })
    }
    next()
  } else {
    if (!to.meta.protected) {
      return next()
    }
    router.push('/browse')
  }
})

/* eslint-disable no-new */

new Vue({
  router,
  store,
  template: '<App/>',
  el: '#app',
  components: {
    App
  }
}).$mount('#app')

global.waitFor = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve, ms)
  })
}

global.to = (promise) => {
  return promise.then(data => {
    return [null, data]
  })
    .catch(err => [err])
}
