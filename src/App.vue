<template>
  <div id="app" v-bind:class="{ 'dark-theme': darkMode }" style="height: 100%; overflow-y: auto">
  <meta name="viewport" content="width=device-width">
    <navbar></navbar>
    <router-view></router-view>
  </div>
</template>

<script>
import Navbar from './components/Navbar'
import 'assets/css/materialize.css'; 
import 'assets/js/materialize.js'; 



export default {
  mounted (){
    
  },
  computed: {
    darkMode: function(){
      return this.$store.getters.getSettingDARKMODE
    }
  },
  components: { Navbar }
}
</script>