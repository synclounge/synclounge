// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'

import Vuetify from 'vuetify'
import { ObserveVisibility } from 'vue-observe-visibility/dist/vue-observe-visibility'
import VueVideoPlayer from 'vue-video-player'

Vue.directive('observe-visibility', ObserveVisibility)
Vue.use(Vuetify)
Vue.use(VueVideoPlayer)


import App from './App'
import router from './router'
import store from './store'


Vue.config.productionTip = false

// Our Event bus
window.EventBus = new Vue()

require('videojs-contrib-hls')

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
