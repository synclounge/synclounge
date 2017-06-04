<template>
  <div id="app" style="height: 100%; overflow-y: auto">
    <navbar></navbar>
    <router-view></router-view>
  </div>
</template>

<script>
  import Navbar from './components/Navbar'
  import 'assets/css/materialize.css';
  import 'assets/js/materialize.js';

  export default {
    mounted () {
      console.log('route', this.$route)
      if (this.$route.query.ptserver && this.$route.query.ptroom) {
        console.log('We should auto join')
        // Looks like a valid request...
        // Lets setup an auto join and then move the user to /sync
        this.$store.commit('SET_AUTOJOIN', true)
        this.$store.commit('SET_AUTOJOINROOM', this.$route.query.ptroom)
        this.$store.commit('SET_AUTOJOINPASSWORD', this.$route.query.ptpassword)
        this.$store.commit('SET_AUTOJOINURL', this.$route.query.ptserver)
      }
    },
    computed: {
      darkMode: function () {
        return this.$store.getters.getSettingDARKMODE
      }
    },
    components: {Navbar}
  }
</script>
