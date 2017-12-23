require('videojs-contrib-hls/dist/videojs-contrib-hls.js')
require('vanilla-tilt');

import Vue from 'vue'
import VueScrollTo from 'vue-scrollto'
import Vuetify from 'vuetify'
import { ObserveVisibility } from 'vue-observe-visibility/dist/vue-observe-visibility'
import VueVideoPlayer from 'vue-video-player'
import VueResource from 'vue-resource'
import VueClipboards from 'vue-clipboards'



Vue.use(VueScrollTo)
Vue.use(VueClipboards);
Vue.use(VueResource);
Vue.directive('observe-visibility', ObserveVisibility)
Vue.use(VueVideoPlayer)

Vue.use(Vuetify, {
  theme: {
    primary: '#E5A00D',
    secondary: '#b0bec5',
    accent: '#8c9eff',
    error: '#b71c1c'
  }
})

import App from './App'
import router from './router'
import store from './store'

Vue.config.productionTip = false

// Our Event bus
window.EventBus = new Vue()

Vue.mixin({
  computed: {
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
    plexserver: function () {
      return this.plex.servers[this.$route.params.machineIdentifier]
    }
  }
})

router.beforeEach((to, from, next) => {
  console.log('Route change', to, this, store)
  if (to.matched.some(record => record.meta.protected)) {
    // this route requires us to be in a room with a client selected
    // if not, redirect to the needed stage
    if (!store.getters.getChosenClient) {
      console.log('Router: client is', store.getters.getChosenClient)
      return next({
        path: '/clientselect'
      })
    }   
    if (!store.getters.getRoom) {
      console.log('Router: room is', store.getters.getRoom)
      return next({
        path: '/joinroom'
      })
    }           
    if (!store.getters.getServer) {
      console.log('Router: server is', store.getters.getServer)
      return next({
        path: '/joinroom'
      })
    }
    console.log('Valid route change!')
    next()
  } else {
    next() // make sure to always call next()!
    router.push('/browse')
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})

global.waitFor = async (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve, ms)
  })
}



global.to = (promise) => {  
  return promise.then(data => {
     return [null, data];
  })
  .catch(err => [err]);
}