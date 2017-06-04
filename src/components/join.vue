<template>
	<div style="height: calc(100% - 64px" class="row">
        <div class="col s12 l4 offset-l4">
            <div class="row" style="padding-top:10%">
                <div class="col l4 s12 left">
                    <img :src="logo" style="width:100%"/>
                </div>
                <div class="col l8 s12 left">
                    <h2 class="center"> Welcome to Plex Together!</h2>
                    <div class="row">
                        <div class="col l12 s12 center">
                            <div style="color:white">
                              <span style="font-weight:900">{{ owner }}</span> has invited you to join the room "<span style="font-weight:900">{{ room }}</span>"
                            </div>
                            <div class="row" style="margin:5%">
                              <div class="col l12 s12">
                                <v-btn class="center" style="background-color: #E5A00D" v-on:click.native="letsGo()">Accept Invite</v-btn>
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// CSS imports
import 'assets/css/material-components-web.css';
import 'assets/css/grid.css';
import 'assets/css/style2.css';




export default {
  name: 'join',
  mounted: function(){
    var that = this
    console.log('Hello from join...')
    this.password = this.$route.query.ptpassword
    this.room = this.$route.query.ptroom
    this.server = this.$route.query.ptserver
    this.owner = this.$route.query.owner

    if (this.room && this.server){
        // Looks like a valid request...
        // Lets setup an auto join and then move the user to /sync
        this.$store.commit('SET_AUTOJOIN',true)
        this.$store.commit('SET_AUTOJOINROOM',this.room)
        this.$store.commit('SET_AUTOJOINPASSWORD',this.password)
        this.$store.commit('SET_AUTOJOINURL',this.server)
    }
  },
  created: function(){
  },
  data () {
      return {
          server: null,
          room: null,
          server: null,
          owner: null
      }
  },
  computed:{
        logo: function(){
            return 'static/logo-small-light.png'
        }
   },
   methods: {
    letsGo(){
      this.$router.push('/sync')
    }
   }

}
</script>

