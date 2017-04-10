<template>
  <div class="mdc-permanent-drawer__toolbar-spacer windowDrag" style="padding: 0">
    <div class="row" style="width: 100%">
        <div class="col s12 " style="height: 63px">
            <a class="left" style="padding-top: 5px">
                <div class="windowNoDrag dropdown-button" data-activates="dropdown1"> 
                    <div class="left">
                        <img v-if="plex" v-bind:src="plex.user.thumb" alt="" id="meAvatar" class="circle ptuser-avatar plexNavAccount right" style="height: 54px; width: 54px">
                    </div>
                    <div class="right" style="bottom: 0">
                        <i class="material-icons navDropdown right plex-shuttlegray-text" style="opacity: 0.6;margin-top: 39px;margin-left: -17px;margin-right: -7px;">arrow_drop_down</i> 
                    </div>
                </div>
                <ul id="dropdown1" class="dropdown-content plex-riverbed" style="width: 229px; top: 68px; left: 5px; position: absolute; opacity: 1; display: none; padding: 0">
                    <li v-on:click="openSettings()" class="preferences"><a>Preferences</a></li>
                    <li v-on:click="refreshPlexDevices()" class="preferences"><a>Refresh Plex Devices</a></li>
                    <hr style="border-color: rgba(0,0,0,0.1); width: 90%">      
                    <li>
                      <a class="navbar-brand" target="_blank" href="https://github.com/samcm/PlexTogether"> Github </a>        
                    </li>              
                    <li>
                      <a class="navbar-brand" target="_blank" href="https://discord.gg/fKQB3yt"> Discord </a>
                    <hr style="border-color: rgba(0,0,0,0.1); width: 90%">        
                    </li>
                    <li class="divider"></li>
                    <li v-if="plex != null"><router-link to="/signout" class="nav-item nav-link"> Sign Out </router-link></li> 
                </ul>
            </a>
            <ul class="nav navbar-nav center">
              <li style="padding:1%;">
                <img class="hide-on-med-and-down" style="height: 50px; width: 54px; vertical-align: middle; margin-top: -7px" v-bind:src="logo"></img>
              </li>
              <li style="padding:1%;">
                <a class="navbar-brand" href="/ptweb"> Home </a>
              </li>
              <li style="padding:1%;">
                <router-link to="/app" class="nav-item nav-link"> Launch </router-link>        
              </li> 
              <li v-if="showLinkShortener">
                <v-btn v-on:click.native="generateShortLink()">Invite</v-btn>
              </li>
              <li class="right">
                <div class="nav navbar-nav right">
                  <div class="switch">
                    <label>
                      Dark mode
                      <input v-model="darkMode" type="checkbox">
                      <span style="background-color:#818181 !important;" class="lever"></span>
                    </label>
                  </div>
                </div>
              </li>
            </ul>            
        </div>
    </div>        
    <div v-if="darkMode">
      <sweet-modal ref="settingsModal" overlay-theme="dark" modal-theme="dark">
          <settings></settings>           
      </sweet-modal>
      <sweet-modal ref="statisticsModal" overlay-theme="dark" modal-theme="dark">
          <statistics></statistics>             
      </sweet-modal>
    </div>
    <div v-if="!darkMode">
      <sweet-modal ref="settingsModal" overlay-theme="light" modal-theme="light">
          <settings></settings>           
      </sweet-modal>
      <sweet-modal ref="statisticsModal" overlay-theme="light" modal-theme="light">
          <statistics></statistics>             
      </sweet-modal>
    </div>

  </div>
</template>

<script>


import { SweetModal, SweetModalTab } from 'sweet-modal-vue'
import settings from './application/settings'
import statistics from './application/statistics'

  export default {   
    components: {
      settings,
      statistics,
      SweetModal,
      SweetModalTab
    },
    data(){
      return {
        shortUrl: null
      }
    },
    mounted: function (){
    },
    computed: {
      plex: function () {
        return this.$store.getters.getPlex
      },
      plexusername: function() {
        return this.$store.state.plex.user.username
      },      
      plexthumb: function() {
        return this.$store.state.plex.user.thumb
      },
      logo: function(){
        if (this.$store.getters.getSettingDARKMODE){
          return 'static/logo-small-light.png'
        }
        return 'static/logo-small-dark.png'
      },
      ptConnected: function(){
          return this.$store.getters.getConnected
      },
      ptServer: function(){
          return this.$store.getters.getServer
      },       
      ptRoom: function(){
          return this.$store.getters.getRoom
      },       
      ptPassword: function(){
          return this.$store.getters.getPassword
      }, 
      showLinkShortener: function(){
        if (this.ptConnected && this.ptServer && this.ptRoom){
          return true
        }
        return false
      }, 
      darkMode: {
          get () {
              return this.$store.getters.getSettingDARKMODE
          },
          set (value) {
            this.$store.commit('setSettingDARKMODE',value)
          }
      },
    },
    methods: {
      setDarkMode: function (){
        return this.$store.commit('setSettingDARKMODE',!this.$store.getters.getSettingDARKMODE)
      },
      openSettings: function(){
        return this.$refs.settingsModal.open()
      },
      openStatistics: function(){
        return this.$refs.statisticsModal.open()
      },
      generateShortLink: function(){
        console.log('Generating a shortened link')
        let socket = this.$store.getters.getSocket
        let url = window.location.origin

        let password = ''
        if (this.$store.getters.getPassword){
          password = this.$store.getters.getPassword
        }
        let data = {
          urlOrigin: window.location.origin,
          owner: this.$store.getters.getPlex.user.username,
          ptserver: this.$store.getters.getServer,
          ptroom: this.$store.getters.getRoom,
          ptpassword: password
          
        }
        console.log(data)



        socket.on('shorten-result',function(shortUrl){
          console.log('Our short url is ' + shortUrl)
        })
        socket.emit('shorten',data)
      },
      refreshPlexDevices: function(){
        let oldClient = this.$store.getters.getChosenClient
        if (this.$store.getters.getSocket){
          this.$store.getters.getSocket.disconnect()
        }
        this.$store.commit('SET_CHOSENCLIENT',null)
        this.$store.commit('REFRESH_PLEXDEVICES')
      }
    }
  }
</script>
