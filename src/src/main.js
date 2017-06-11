// =============== Base libraries integration ==================
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueTranslate from 'vue-translate-plugin'
import VTooltip from 'v-tooltip'
import VueClipboards from 'vue-clipboards'
import VueVideoPlayer from 'vue-video-player'
import VueObserveVisibility from 'vue-observe-visibility'
import VueLazyload from 'vue-lazyload'
import Vuetify from 'vuetify'
import Toast from 'vue-easy-toast'


import store from './store'
import router from './router'
import App from './App'

// Our Event bus
window.EventBus = new Vue()

require('videojs-contrib-hls')

// mount with global
Vue.use(Toast)
Vue.use(VueLazyload, {
  lazyComponent: true
})
Vue.use(VueObserveVisibility)
Vue.use(VueVideoPlayer)
Vue.use(VueClipboards) 
Vue.use(Vuetify)
Vue.use(VTooltip)
Vue.use(VueResource)
Vue.use(VueTranslate)

// Toast notifications
window.EventBus.$on('notification', (message) => {
  console.log('Sending notification: ' + message)
  Vue.toast(message, {
    mode: 'override'
  })
})

// ======================== Vue Instance =======================
/* eslint-disable no-new */
new Vue({
  router,
  store,
  el: '#app',
  render: h => h(App)
})
