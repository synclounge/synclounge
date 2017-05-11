<template>
	<div class="main-body mdc-typography" style="height: calc(100% - 64px);overflow-y:auto">
      <div class="nav-wrapper hide-on-large-only"><a id="logo-container" href="#" class="brand-logo"></a>
        <ul id="nav-mobile" class="side-nav" style="height: 100%">
          <sidebar :mobile="true"></sidebar>
        </ul>
<!--         <a class="button-collapse "><i class="material-icons">keyboard_arrow_right</i></a> -->
        <a href="#" data-activates="nav-mobile" class="button-collapse btn-floating btn-large waves-effect waves-light plex-gamboge" style="position: fixed; bottom: 15px; left: 15px"><i class="material-icons">keyboard_arrow_right</i></a>
      </div>
      <div class="content row" style="margin-bottom: 0">
          <div class="row main-body" style="height: 100%; margin-bottom: 0">

              <!-- MAIN CONTENT -->
              <div class="col l12 s12 center" id="main-body" v-if="!validDevices" style="padding-top:5%">               
                    <v-progress-circular yellow active large></v-progress-circular>
              </div>
              <div class="col l12 s12 no-padding" id="main-body" v-if="validDevices" style="height: 100%">               
                  <div v-if="!ptConnected || !chosenClient" style="height: 100%; overflow-y: visible">
                      <walkthrough></walkthrough>
                  </div>                  
                  <plexbrowser v-if="showBrowser"></plexbrowser>
                  <ptplayer v-if="isPTPlayer" style="height:100%;"></ptplayer>
                  <nowplaying v-if="showMetadata"></nowplaying>
              </div>

              <!-- CHAT INTERFACE -->

              <div v-if="ptConnected && chosenClient" class="col l3 s12 no-padding" id="plexTogetherChat" style="height: 100%; border-left: 1px solid rgba(0, 0, 0, 0.12)">
                 <div class="mdc-permanent-drawer chatInterface" style="height:100%">
                      <div class="mdc-permanent-drawer__toolbar-spacer">
                          <div class="row" style="width: 100%;">
                              <div class="col l8  left-align truncate">
                                  <div id="plexTogetherRoomNameChat" style="font-size:1.5vh">#{{ ptRoom }}</div>                           
                              </div>                              
                              <div class="col l4  right-align truncate">
                                   <div> {{ userCount }}</div>    
                                  <label> {{ ptServer }}</label>                                    
                              </div>
                          </div>
                      </div>                
                      <div style="height: 60%;  overflow-y: scroll; border-top: 1px solid rgba(0, 0, 0, 0.12)">
                        <ul class="mdc-list mdc-list--two-line mdc-list--avatar-list two-line-avatar-text-icon-demo page-userlist" v-for="user in ptUsers" style="overflow-y: scroll">
                            <ptuser :object="user"></ptuser>
                        </ul>
                    </div>
                      <div class="mdc-list-group" style="overflow-y: auto; height: calc(40% - 64px); top: 110px; border-top: 1px solid rgba(0, 0, 0, 0.12) ">
                          <section>
                              <ul v-for="msg in messages" id="chatBox">
                                  <chatmessage :object="msg"></chatmessage>
                              </ul>
                          </section>
                      </div>      
                      <div class="mdc-permanent-drawer__toolbar-spacer no-padding" style="border: 0">
                          <div class="channel-textarea">  
                              <div class="channel-textarea-inner">
                                  <div class="channel-textarea-upload">
                                      <textarea rows="1" v-bind:placeholder="chatBoxMessage" style="height: auto; overflow-y: auto;" v-on:keyup.enter="sendMessage()" v-model="messageToBeSent"></textarea>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

        <!-- MODALS -->
        <div v-if="darkMode">
            <sweet-modal v-on:close="joinRoomModalClosed()" ref="joinroomModal" overlay-theme="dark" modal-theme="dark" >
                <joinroom></joinroom>       
            </sweet-modal>
        </div>        
        <div v-if="!darkMode">
            <sweet-modal ref="joinroomModal" overlay-theme="light" modal-theme="light" >
                <joinroom></joinroom>       
            </sweet-modal>
        </div>

<!--         <div id="joinRoomModal" class="modal" style="width: 25%; min-width: 400px; overflow: hidden">   
            <joinroom></joinroom>         
        </div>
        <div id="settingsModal" class="modal" style="width: 45%; min-width: 400px; overflow: hidden">     
        </div>        
        <div id="statisticsModal" class="modal" style="width: 70%; min-width: 400px; overflow: hidden">   
        </div> -->
    </div>
</template>
 
<script>
// CSS imports
import 'assets/css/material-components-web.css'; 
import 'assets/css/grid.css'; 
import 'assets/css/style2.css'; 

// JS imports
import _Plex from 'assets/js/plex/PlexTv.js';
import PlexClient from 'assets/js/plex/PlexClient.js';

var Plex = new _Plex()
let plexstorage = JSON.parse(window['localStorage'].getItem('plexuser'))


// Components
import plexclient from './application/plexclient'
import plexserver from './application/plexserver'
import ptuser from './application/ptuser'
import joinroom from './application/joinroom'
import chatmessage from './application/chatmessage'
import walkthrough from './application/walkthrough'
import sidebar from './application/sidebar'
import ptplayer from './application/ptplayer'
import plexbrowser from './application/plexbrowser'
import nowplaying from './application/nowplaying'

import { SweetModal, SweetModalTab } from 'sweet-modal-vue'



export default {
  name: 'application',
  components: {
      plexclient,
      plexserver,
      joinroom,
      sidebar,
      ptuser,
      chatmessage,
      walkthrough,
      ptplayer,
      SweetModal,
      SweetModalTab,
      plexbrowser,
      nowplaying
  },
  mounted: function(){        
    $('.button-collapse').sideNav();$(".button-collapse").sideNav();
    if (window['localStorage'].getItem('plexuser') == null){
        console.log('User isnt signed in  - sending to signin')
        this.$router.push('/signin')
        return
    }
    var that = this
    console.log('Logging in to Plex.Tv')
    let plexstorage = JSON.parse(window['localStorage'].getItem('plexuser'))
    Plex.doTokenLogin(plexstorage.authToken,function(result,response,body){        
        if (result){
            console.log('Logged in.')
            Plex.getDevices(function(){            



                that.$store.commit('SET_PLEX',Plex) 

                if (that.$store.getters.getAutoJoin){                    
                    that.$store.dispatch('autoJoin')
                    that.$store.commit('SET_AUTOJOIN',false)
                }


            })
        } else {
            console.log('Signin failed')
            window['localStorage'].removeItem('plexuser')
            that.$store.state.plex = null
            that.$store.state.signedin = 'notsignedin'
            that.$router.push('/signin')

        }
    }) 

    if (this.$store.getters.getAutoJoin){
        // Attempt to auto join 
        console.log('Attempting to auto join ' + that.$store.getters.getAutoJoinUrl)
        that.$store.dispatch('socketConnect',{
            address:that.$store.getters.getAutoJoinUrl,
            callback:function(data){
                
            }
        })
    }

  },
  created: function(){    
  },
  data () {
      return {
          clientpollers: [],
          showToggleChat: false,
          messageToBeSent: ''
      }
  },
  computed:{
       plex: function(){
           return this.$store.getters.getPlex
       },   
       chosenClient: function(){
           return this.$store.getters.getChosenClient
       },
       validPlex: function(){
            if (!this.$store.state.plex) {                
                return false
            }
            return true
       },   
       validDevices: function(){
           if (!this.plex){
               return false
           } return this.plex.gotDevices
       },
       showBrowser(){
           return (this.chosenClient && !this.chosenClient.clientPlayingMetadata && this.ptRoom)
       },
       isPTPlayer(){
           return (this.chosenClient && this.chosenClient.clientIdentifier == 'PTPLAYER9PLUS10')
       },
       showMetadata(){
           return (!this.isPTPlayer && !this.showBrowser && this.chosenClient && this.chosenClient.clientPlayingMetadata)
       },
       darkMode: function(){
           return this.$store.getters.getSettingDARKMODE
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
       ptUsers: function(){
           return this.$store.getters.getUsers
       },
       userCount: function(){
           let count = this.$store.getters.getUsers.length
           if (count == 1){
               return count + ' user'
           }
           return count + ' users'
       },
       chatBoxMessage: function(){
           return "Message " + this.$store.getters.getRoom
       },
       playercount: function(){
           if (this.$store.state.plex && this.$store.state.plex.gotDevices){
               return '(' + this.$store.state.plex.clients.length + ')'
           }
           return ''
       },       
       servercount: function(){
           if (this.$store.state.plex && this.$store.state.plex.gotDevices){
               return '(' + this.$store.state.plex.servers.length + ')'
           }
           return ''
       },  
       showChatValue: function(){
           if (this.$store.getters.getShownChat){
               return 'block'
           }
           return 'none'
       },
       messages: function(){
           return this.$store.getters.getMessages
       },
       step1Complete: function(){
           if (this.chosenClient){
               return '0.2'
           }
           return '1'
       },       
       upToStep2: function(){
           if (this.chosenClient){
               return '1'
           }
           return '0.2'
       },
       stateTESTING: function(){
           return this.$store
       },

   },
   methods: {
       openJoinRoomModal: function(){
           //console.log('trying to open')
           return this.$refs.joinroomModal.open()
           //$('#joinRoomModal').modal('open');
       },
       joinRoomModalClosed: function(){
           if (!this.ptRoom){
                this.$store.dispatch('disconnectServer')
           }
       },
       showChat: function(){
            this.showToggleChat = !this.showToggleChat
            console.log('toggleChat')
       },
       sendMessage: function(){
           console.log('We should send this message: ' + this.messageToBeSent)
           this.$store.dispatch('sendNewMessage', this.messageToBeSent)
           this.messageToBeSent = ''
       }
    },
    beforeDestroy: function(){
        console.log('About to destroy')
        if (this.$store.getters.getSocket){
            this.$store.getters.getSocket.disconnect()
        }
    }
    
}
</script>

