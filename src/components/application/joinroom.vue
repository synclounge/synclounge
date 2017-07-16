<template>
  <v-layout row wrap>
    <v-flex xs12 v-if="!context.getters.getConnected"
        style="color:white !important">
      <v-select
        dark="false"
        v-bind:items="ptservers"
        class="input-group--focused pt-input"
        style="mt-4"
        v-model="selectedServer"
        transition="v-scale-transition" origin="center center"
        max-height="auto"
        label="Select a server"
        append-icon="arrow_drop_up"
      ></v-select> 
      <v-text-field
        v-if="selectedServer == 'custom'"
        name="input-2"
        label="Custom Server"
        v-model="CUSTOMSERVER"
        class="input-group pt-input"
      ></v-text-field>
      <v-layout row wrap v-if="selectedServer == 'custom'">
        <v-flex xs4 offset-xs4>
          <v-btn class="pt-orange white--text pa-0 ma-0" primary style="width:100%" v-on:click.native="attemptConnectCustom()">Connect</v-btn>
        </v-flex>  
      </v-layout>       
      <v-layout row wrap v-if="connectionPending">
        <v-flex xs4 offset-xs4 center>          
          <div style="width:100%;text-align:center">				
            <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
          </div>
        </v-flex>  
      </v-layout>       
      <v-layout class="pt-3" row wrap v-if="serverError">
        <v-flex xs12 class="red--text">          
         <v-icon class="red--text">info</v-icon> {{ serverError }}   
        </v-flex>  
      </v-layout> 
    </v-flex>     
    <v-flex xs12 v-if="context.getters.getConnected">
      <v-layout row wrap>
        <v-flex xs12>          
         <v-text-field
            transition="v-scale-transition" origin="center center"
            :maxlength="25"
            name="input-2"
            label="Room name"
            :autofocus="true"
            v-on:keyup.enter.native="joinRoom()"
            v-model="room"
            class="input-group"
            
          ></v-text-field>
        </v-flex>  
        <v-flex xs12>          
         <v-text-field
            transition="v-scale-transition" origin="center center"
            name="input-2"
            label="Room password"
            v-on:keyup.enter.native="joinRoom()"
            v-model="password"
            class="pt-0 mt-0 input-group orange--text"
            
          ></v-text-field>
        </v-flex>        
        <v-flex xs4 offset-xs4>
          <v-btn class="pt-orange white--text pa-0 ma-0" primary style="width:100%" v-on:click.native="joinRoom()">Join</v-btn>
        </v-flex>  
        <v-layout class="pt-3" row wrap v-if="roomError">
          <v-flex xs12 class="red--text">          
          <v-icon class="red--text">info</v-icon> {{ roomError }}   
          </v-flex>  
        </v-layout>   
      </v-layout>       
    </v-flex> 
  </v-layout>  
</template>

<script>
  export default {
    props: ['object'],
    name: 'joinroom',
    data () {
      return {
        selectedServer: '',
        serverError: null,
        roomError: null,
        room: '',
        password: '',
        connectionPending: false,
        thisServer: window.location.origin,

        ptservers: [
          {
            text: 'PlexTogether AU1',
            value: 'https://au1.plextogether.com'
          },
          {
            text: 'PlexTogether US1',
            value: 'https://us1.plextogether.com'
          },
          {
            text: 'PlexTogether EU1',
            value: 'https://eu1.plextogether.com'
          },
          {
            text: 'Custom Server',
            value: 'custom'
          }
        ]
      }
    },
    methods: {
      attemptConnect: function () {
        var that = this
        // Attempt the connection
        this.serverError = null
        if (this.selectedServer != 'custom') {
          console.log('Attempting to connect to ' + this.selectedServer)
          this.connectionPending = true
          this.$store.dispatch('socketConnect', {
            address: this.selectedServer,
            callback: (data) => {
              this.connectionPending = false
              if (!data.result) {
                this.serverError = "Failed to connect to " + this.selectedServer
              } else {
                this.serverError = null
              }
            }
          })
        }
        return
      },
      attemptConnectCustom: function () {
        var that = this
        this.connectionPending = true
        this.serverError = null
        console.log('Attempting to connect to ' + this.CUSTOMSERVER)
        this.$store.dispatch('socketConnect', {
          address: this.CUSTOMSERVER,
          callback: (data) => {
            console.log(data)
            this.connectionPending = false
            if (!data.result) {
              console.log('Failed to connect')
              this.serverError = "Failed to connect to " + this.CUSTOMSERVER
            } else {
              this.serverError = null
            }
          }
        })
      },
      joinRoom: function () {
        var that = this
        console.log('Attempting to join room ' + this.room)
        if (!this.context.getters.getConnected) {
          console.log('Cant join room because we arent connected to a server!')
          return
        }
        if (this.room == '' || this.room == null) {
          this.roomError = 'You must enter a room name!'
          return
        }
        let temporaryObj = {
          user: this.plex.user,
          roomName: this.room.toLowerCase(),
          password: this.password,
          callback: function (result) {
            if (result) {
              //that.$parent.$parent.$refs.joinroomModal.close()
              //$('#joinRoomModal').modal('close');
              that.selectedServer = ''
            }
          }
        }
        this.$store.dispatch('joinRoom', temporaryObj)
      }
    },
    watch: {
      selectedServer: function() {
        this.attemptConnect()
        this.serverError = null
      }
    },
    computed: {
      plex: function () {
        return this.$store.state.plex
      },
      context: function () {
        return this.$store
      },
      darkModeBackground: function () {
        if (this.$store.getters.getSettingDARKMODE) {
          return {
            'background-color': '#282A2D'
          }
        }
        return {}

      },
      CUSTOMSERVER: {
        get () {
          if (!this.$store.getters.getSettingCUSTOMSERVER) {
            return 'http://'
          }
          return this.$store.getters.getSettingCUSTOMSERVER
        },
        set (value) {
          this.$store.commit('setSettingCUSTOMSERVER', value)
        }
      },
    },
    mounted: function () {
      // Create event listeners
    }
  }
</script>

