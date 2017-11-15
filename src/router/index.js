import Vue from 'vue'
import Router from 'vue-router'
// ===================== Pages Components ======================
import signin from '../components/signin'
import signout from '../components/signout'
import home from '../components/home'
import application from '../components/application'
import join from '../components/join'

Vue.use(Router)

// ==================== Router registration ====================
export default new Router({
  mode: 'hash',
  base: '/ptweb/',
  routes: [
    { path: '/', component: home },
    { path: '/signin', component: signin },
    { path: '/signout', component: signout },
    { path: '/join', component: join },

    
    { path: '/browse', component: application },    
    { path: '/browse/:machineIdentifier', component: require('../components/application/plexbrowser/plexserver.vue') },
    { path: '/browse/:machineIdentifier/library/:sectionid', component: require('../components/application/plexbrowser/plexlibrary.vue') },
    { path: '/browse/:machineIdentifier/:ratingKey', component: require('../components/application/plexbrowser/plexcontent.vue') },



    { path: '*', component: home },
  ]
})
