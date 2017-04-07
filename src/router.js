import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

// ===================== Pages Components ======================
import signin from './components/signin'
import signout from './components/signout'
import home from './components/home'
import application from './components/application'

// ==================== Router registration ====================
export default new Router({
  mode: 'hash',
  routes: [
    { path: '/', component: home },
    { path: '/app', component: application },
    { path: '/signin', component: signin },    
    { path: '/signout', component: signout },
  ]
})
