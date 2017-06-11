// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'

import App from './App'

import router from './router'
import store from './store'

Vue.use(Vuetify)

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
