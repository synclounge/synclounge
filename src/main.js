
// =============== Base libraries integration ==================
import Vue from 'vue'
import VueResource from 'vue-resource'
import VueTranslate from 'vue-translate-plugin'
import VTooltip from 'v-tooltip'
import Materials from 'vue-materials'
import VueChatScroll from 'vue-chat-scroll'
import VueClipboards from 'vue-clipboards'
import VueVideoPlayer from 'vue-video-player'
import VueObserveVisibility from 'vue-observe-visibility'
import VueLazyload from 'vue-lazyload'

// Our Event bus 
window.EventBus = new Vue()

require('videojs-contrib-hls/dist/videojs-contrib-hls.js')

// mount with global 
Vue.use(VueLazyload)
Vue.use(VueObserveVisibility)
Vue.use(VueVideoPlayer)
Vue.use(VueClipboards);
Vue.use(VueChatScroll)
Vue.use(Materials)
Vue.use(VTooltip)
Vue.use(VueResource)
Vue.use(VueTranslate)

require('vue2-animate/dist/vue2-animate.min.css')




import store from './store'
import router from './router'

// ===== Bootstrap components integration (JQuery needed) ======
//window.$ = window.jQuery = require('jquery')
//require('bootstrap-sass')

// ======================= Base Component ======================
import App from './App'

// ======================== Vue Instance =======================
/* eslint-disable no-new */
new Vue({
  router,
  store,
  el: '#app',
  render: h => h(App)
})
