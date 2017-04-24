
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

// Our Event bus 
window.EventBus = new Vue()

// mount with global 

Vue.use(VueObserveVisibility)
Vue.use(VueVideoPlayer)
Vue.use(VueClipboards);
Vue.use(VueChatScroll)
Vue.use(Materials)
Vue.use(VTooltip)
Vue.use(VueResource)
Vue.use(VueTranslate)

require('vue2-animate/dist/vue2-animate.min.css')

Vue.directive('focus', {
    inserted: function (el) {
        el.focus();
    },
    update: function (el) {
        Vue.nextTick(function() {
              el.focus();
        })
    }
})

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
