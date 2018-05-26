<template>
  <v-layout row wrap justify-center>
    <v-flex xs12 lg8 xl6 style="background: rgba(0,0,0,0.1); border-radius: 10px" class="pa-4">
      <v-layout row wrap justify-center>
        <v-flex xs12 md8 lg4 xl6>
          <img style="width:100%" :src="logo">
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
            Choose a client from the list below. Once you've found the client you would like to use, click the connect button. SyncLounge will test to see if it can connect with the client and will let you know if it cannot.
          </v-flex>
        </v-layout>
        <v-divider></v-divider>
        <div v-if="plex && !plex.gotDevices" class="text-xs-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <v-layout v-else row wrap>
          <v-flex xs12 md6 lg7>
            <v-subheader>Plex Players {{ playercount }}</v-subheader>
            <div v-for="i in recentClients" :key="i.clientIdentifier">
              <div v-on:click="previewClient(i); ; gotResponse = true">
                <plexclient :startup="testClient" :sidebar="false" :selected="isClientSelected(i)" :object="i" style="cursor: pointer"></plexclient>
              </div>
            </div>
          </v-flex>
          <v-flex xs12 md6 lg5>
            <div v-if="testClient">
              <v-subheader>
                Selected Player
              </v-subheader>
              <div class="pl-1">
                <h3>{{ testClient.name }}</h3>
                <div>
                  <label >Last seen</label><span style="opacity:0.8">  {{ lastSeenAgo(testClient.lastSeenAt) }}</span>
                </div>
                <div>
                  <label>Device</label><span style="opacity:0.8">  {{ testClient.device }}</span>
                </div>
                <div>
                  <label>Running</label><span style="opacity:0.8">  {{ testClient.product }} </span>
                </div>
                <div class="pb-2">
                  <label>Platform</label><span style="opacity:0.8">  {{ testClient.platform }} </span>
                </div>
                <div v-if="!gotResponse" class="center spinner-orange">
                  <div style="width:100%;text-align:center">
                    <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
                  </div>
                </div>
                <div v-if="gotResponse">
                  <v-btn block color="primary" v-on:click.native="clientClicked()">Connect</v-btn>
                </div>
                <div v-if="testClient.product.indexOf('Web') > -1">
                  Note: Plex Web is currently not supported
                </div>
                <div v-if="isHttps && testClient.clientIdentifier !== 'PTPLAYER9PLUS10'">
                  Note: You may not be able to connect to external Plex Clients while loading the page via HTTPS. Click <a :href="nohttpslink">here</a> to load the page via HTTP. More info <a href="https://github.com/samcm/synclounge/issues/52" target="_blank">here</a>.
                </div>
                <div class="red--text lighten-3 text-xs-center" v-if="testClientErrorMsg">
                  {{ testClientErrorMsg }}
                </div>
              </div>
            </div>
          </v-flex>
        </v-layout>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import plexclient from './plexclient'
import joinroom from './joinroom'

import { mapState } from 'vuex'

var moment = require('moment')

export default {
  props: ['object'],
  name: 'walkthrough',
  data () {
    return {
      testClient: null,
      testClientErrorMsg: null,
      gotResponse: true,
      e1: '1',
      joinRoomModal: false
    }
  },
  components: {
    plexclient,
    joinroom
  },
  computed: {
    chosenClient: function () {
      return this.$store.getters.getChosenClient
    },
    isHttps: function () {
      return location.protocol === 'https:'
    },
    clients: function () {
      return this.plex.clients
    },
    ...mapState(['plex']),
    context: function () {
      return this.$store
    },
    playercount: function () {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return '(' + Object.keys(this.plex.clients).length + ')'
      }
      return ''
    },
    nohttpslink: function () {
      if (!this.isHttps) {
        return ''
      }
      let url = 'http:' + window.location.href.substring(window.location.protocol.length)
      if (this.$store.state.autoJoin) {
        console.log('Autojoining...')
        url = url + '?server=' + this.$store.state.autoJoinUrl + '&room=' + this.$store.state.autoJoinRoom + '&autojoin=true&owner=' + this.$store.state.autoJoinOwner
        if (this.$store.state.autoJoinPassword) {
          url = url + '&password=' + this.$store.state.autoJoinPassword
        }
      }
      url = url.replace('clientselect', 'join')
      return url
    },
    logo: function () {
      return this.logos.light.long
    },
    recentClients: function () {
      return this.$store.getters.recentClients
    }
  },
  watch: {
    chosenClient: function (to, from) {
      if (this.chosenClient && !from) {
        this.$router.push('/joinroom')
      }
    }
  },
  methods: {
    previewClient: function (client) {
      this.testClient = client
      this.testClientErrorMsg = null
    },
    clientClicked: async function () {
      let client = this.testClient
      this.gotResponse = false
      this.testClientErrorMsg = null
      try {
        let result = await this.$store.dispatch('PLEX_CLIENT_FINDCONNECTION', client)
          .catch(e => {
            console.log(e)
            this.gotResponse = true
            this.testClientErrorMsg = 'Unable to connect to client'
          })
        if (result) {
          this.$store.commit('SET_CHOSENCLIENT', client)
          this.gotResponse = true
        }
      } catch (e) {
        this.gotResponse = true
      }
      // client.findConnection(function (res) {
      //   let plexObj = that.$store.state.plex
      //   if (res) {
      //     client.connectedstatus = 'connected'
      //     that.e1 = '2'
      //     that.$store.commit('SET_CHOSENCLIENT', client)

      //   } else {
      //     client.connectedstatus = 'failed'
      //   }
      // })
    },
    openJoinRoomModal: function () {
      return this.$parent.$refs.joinroomModal.open()
    },
    isClientSelected: function (client) {
      if (client === this.testClient) {
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
      this.$store.commit('SET_CHOSENCLIENT', null)
      this.$store.commit('REFRESH_PLEXDEVICES')
    }
  }
}
</script>
