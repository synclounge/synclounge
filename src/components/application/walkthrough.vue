<template>
  <v-layout >
    <v-flex xs12 lg8 offset-lg2 xl6 offset-xl3 style="background: rgba(0,0,0,0.1); border-radius: 10px" class="pa-4">
      <v-layout row wrap>
        <v-flex xs12 md8 offset-md2 lg4 offset-lg4 xl6 offset-xl3>
          <img style="width:100%" v-bind:src="logo">
        </v-flex>
      </v-layout>
      <v-stepper style="background: rgba(0,0,0,0.3)" v-model="e1" light class="mb-4">
        <v-stepper-header>
          <v-stepper-step step="1" :complete="true">Select a client</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="2" :complete="false">Join a room</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="3">Sync</v-stepper-step>
        </v-stepper-header>
      </v-stepper>
      
      <div v-if="!chosenClient">        
        <v-layout class="mt-2" row wrap>        
          <v-flex xs12 center>
            <h3>Choose your Plex player</h3>
          </v-flex>
          <v-flex xs12>
            Choose a client from the list below. Once you've found the client you would like to use, click the connect button. PlexTogether will test to see if it can connect with the client and will let you know if it cannot.
          </v-flex>
        </v-layout>    
        <v-divider></v-divider>
        <v-layout row wrap>      
          <v-flex xs12 md6 lg7>
            <v-subheader light>Plex Players {{ playercount }}</v-subheader>              
            <div v-for="i in plex.clients">
              <div v-on:click="previewClient(i)">
                <plexclient :startup="testClient" :sidebar="false" :selected="isClientSelected(i)" :object="i" style="cursor: pointer"></plexclient>
              </div>
            </div>
          </v-flex>
          <v-flex xs12 md6 lg5>
            <div v-if="testClient">
              <v-subheader light>
                Selected Player
              </v-subheader>
              <div class="pl-1">
                <h6 light style="opacity:1">{{ testClient.name }}</h6>
                <div>
                  <label >Last seen</label><span style="opacity:0.8">  {{ lastSeenAgo(testClient.lastSeenAt) }}</span>
                </div>
                <div>
                  <label>Device</label><span style="opacity:0.8">  {{ testClient.device }}</span>
                </div>
                <div>
                  <label>Running</label><span style="opacity:0.8" v-tooltip="testClient.productVersion">  {{ testClient.product }} </span>
                </div>
                <div class="pb-2">
                  <label>Platform</label><span style="opacity:0.8" v-tooltip="testClient.platformVersion">  {{ testClient.platform }} </span>
                </div>
                <div v-if="testClientWaiting" class="center spinner-orange">
                  <div style="width:100%;text-align:center">				
                    <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
                  </div>
                </div>
                <div v-if="!testClientWaiting">
                  <v-btn class="pt-orange ml-0" style="width:100%" x-large light v-on:click.native="clientClicked()">Connect</v-btn>
                </div>
                <div v-if="testClient.product.indexOf('Web') > -1">
                  Note: Plex Web is currently not supported
                </div>
                <div v-if="testClientErrorMsg">
                  {{ testClientErrorMsg }}
                </div>
              </div>
            </div>
          </v-flex>
        </v-layout>
      </div>
      <div v-if="chosenClient">
        <v-layout row wrap>
          <v-flex xs12>
            <h5 class="text-xs-center">Connect to a PlexTogether room</h5>
          </v-flex>
        </v-layout>
        <v-layout row wrap>
          <v-flex xs12>
            It's time to connect to PlexTogether. From the list select a server which is closest to your location. Once you've chosen one that works for you it's time to create a room for your friends to join.
          </v-flex>
        </v-layout>
        <v-layout row wrap> 
          <v-flex xs12 lg12>    
            <joinroom></joinroom>
          </v-flex>
        </v-layout>
      </div>
    </v-flex>

  </v-layout>
</template>

<script>

  import plexclient from './plexclient'
  import plexserver from './plexserver'
  import joinroom from './joinroom'

  import moment from '../../../node_modules/moment/moment.js'

  export default {
    props: ['object'],
    name: 'walkthrough',
    data () {
      return {
        testClient: null,
        e1: '1',
        joinRoomModal: false
      }
    },
    components: {
      plexclient,
      plexserver,
      joinroom
    },
    computed: {
      chosenClient: function () {
        return this.$store.getters.getChosenClient
      },
      plex: function () {
        return this.$store.getters.getPlex
      },
      context: function () {
        return this.$store
      },
      logo: function () {
        return 'ptweb/logo-long-light.png'
      },
      playercount: function () {
        if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
          return '(' + this.$store.state.plex.clients.length + ')'
        }
        return ''
      },
      testClientWaiting: function () {
        if (this.testClient.connectedstatus == 'waiting') {
          return true
        }
        return false
      },
      testClientErrorMsg: function () {
        if (this.testClient.connectedstatus == 'failed') {
          return 'Error connecting to client'
        }
        return false
      }
    },
    methods: {
      previewClient: function (client) {
        this.testClient = client
      },
      clientClicked: function () {
        let client = this.testClient
        let clients = this.$store.getters.getPlex.clients
        for (let i = 0; i < clients.length; i++) {
          let _client = clients[i]
          if (_client.connectedstatus == 'waiting') {
            return
          }
        }
        for (let i = 0; i < clients.length; i++) {
          let _client = clients[i]
          _client.connectedstatus = 'fresh'
        }
        //this.$store.state.plex.chosenClient = null
        client.connectedstatus = 'waiting'
        let that = this
        client.findConnection(function (res) {
          let plexObj = that.$store.state.plex
          if (res) {
            client.connectedstatus = 'connected'
            that.e1 = '2'
            that.$store.commit('SET_CHOSENCLIENT', client)

          } else {
            client.connectedstatus = 'failed'
          }
        })
      },
      openJoinRoomModal: function () {
        return this.$parent.$refs.joinroomModal.open()
      },
      isClientSelected: function (client) {
        if (client == this.testClient) {
          return true
        }
        return false
      },
      lastSeenAgo: function (clientTime) {
        let now = moment(new Date().getTime())
        let end = moment.unix(parseInt(clientTime))
        let difference = moment.duration(now.diff(end))
        return difference.humanize() + ' ago'
      },
      refreshPlexDevices: function () {
        let oldClient = this.$store.getters.getChosenClient
        this.$store.commit('SET_CHOSENCLIENT', null)
        this.$store.commit('REFRESH_PLEXDEVICES')
      }
    }
  }
</script>

