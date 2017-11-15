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
Vue.use(Vuetify)
Vue.use(VueVideoPlayer)


import App from './App'
import router from './router'
import store from './store'


Vue.config.productionTip = false

// Our Event bus
window.EventBus = new Vue()

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})

global.waitFor = async (ms) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => resolve, ms)
  })
}

global.to = (promise) => {  
  return promise.then(data => {
     return [null, data];
  })
  .catch(err => [err]);
}