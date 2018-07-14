<template>
  <div>
    <v-layout row wrap justify-center>
      <v-flex xs12 lg8 style="background: rgba(0,0,0,0.1); border-radius: 10px" class="pa-4">
        <v-layout row wrap justify-center>
          <v-flex xs12 md8 lg4 xl6>
            <img style="width:100%" v-bind:src="logo">
          </v-flex>
        </v-layout>
        <v-stepper style="background: rgba(0,0,0,0.3)" v-model="e1" dark class="mb-4">
          <v-stepper-header>
            <v-stepper-step step="1" :complete="true">Select a client</v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step step="2" :complete="false">Join a room</v-stepper-step>
            <v-divider></v-divider>
            <v-stepper-step step="3">Sync</v-stepper-step>
          </v-stepper-header>
        </v-stepper>
        <v-layout row wrap justify-center>
          <v-flex xs12>
            <h2 class="text-xs-left">Connect to a SyncLounge room</h2>
          </v-flex>
          <v-layout row wrap justify-center>
            <v-flex xs12>
              <p class="pa-2">
                It's time to connect to SyncLounge. From the list select a server which is closest to your location. Once you've chosen one that works for you it's time to create a room for your friends to join.
              </p>
            </v-flex>
          </v-layout>
            <v-flex xs12 class="nicelist" v-if="!context.getters.getConnected && recents" style="color:white !important">
              <h4>Recent rooms</h4>
              <v-list class="pa-0">
                <template v-for="(item, index) in recentsSorted">
                  <v-list-tile :key="index" v-if="index < 5" avatar @click="recentConnect(item)">
                    <v-list-tile-avatar>
                      <img :src="logos.light.small" style="width: 32px; height: auto"/>
                    </v-list-tile-avatar>
                    <v-list-tile-content>
                      <v-list-tile-title v-html="item.server"></v-list-tile-title>
                      <v-list-tile-sub-title><b>{{ item.room }}</b> <span style="opacity: 0.5; float: right">{{ sinceNow(item.time) }}</span></v-list-tile-sub-title>
                    </v-list-tile-content>
                  </v-list-tile>
                </template>
              </v-list>
            </v-flex>
            <v-flex xs12 class="nicelist pt-3" v-if="!context.getters.getConnected" style="color:white !important">
              <v-subheader>Select a server</v-subheader>
              <v-layout row wrap>
                <v-flex xs12 md3 v-for="server in ptservers" :key="server.url" class="pa-2">
                  <v-card height="250px" style="background: #353e58">
                    <v-layout row wrap justify-center style="height: 100%">
                      <v-flex xs12 class="text-xs-center pa-2" style="height: 50%; position: relative; background: rgba(0,0,0,0.2)">
                        <img :src="server.flag" class="flag" style="height: 50%; vertical-align: middle"/>
                      </v-flex>
                      <v-flex xs12 style="height: 50%" class="text-xs-center pt-1">
                        <h2>{{ server.text }}</h2>
                        <h4>{{ server.location }}</h4>
                        <v-btn color="primary" :disabled="connectionPending" @click="serverSelected(server)"> Connect</v-btn>
                      </v-flex>
                    </v-layout>
                  </v-card>
                </v-flex>
              </v-layout>
              <!-- <v-select
                box
                v-bind:items="ptservers"
                @input="attemptConnect()"
                class="input-group--focused pt-input nicelist"
                style="mt-4"
                v-model="selectedServer"
                max-height="auto"
                label="Select a server"
              ></v-select> -->
              <v-text-field
                v-if="selectedServer == 'custom'"
                name="input-2"
                label="Custom Server"
                v-model="CUSTOMSERVER"
                class="input-group pt-input"
              ></v-text-field>
              <v-layout row wrap v-if="selectedServer == 'custom'">
                <v-flex xs4 offset-xs4>
                  <v-btn class="pt-orange white--text pa-0 ma-0" color="primary" primary style="width:100%" v-on:click.native="attemptConnectCustom()">Connect</v-btn>
                </v-flex>
              </v-layout>
              <v-layout row wrap v-if="connectionPending && !serverError" class="pt-3">
                <v-flex xs4 offset-xs4 center>
                  <div style="width:100%;text-align:center">
                    <v-progress-circular indeterminate v-bind:size="50" class="amber--text" style="display:inline-block"></v-progress-circular>
                  </div>
                </v-flex>
              </v-layout>
              <v-layout class="pt-3 text-xs-center" row wrap v-if="serverError">
                <v-flex xs12 class="red--text">
                  <v-icon class="red--text">info</v-icon> {{ serverError }}
                </v-flex>
              </v-layout>
            </v-flex>
          <v-layout row wrap justify-center>
            <v-flex xs12 v-if="context.getters.getConnected">
              <v-layout row wrap>
                <v-flex xs12>
                  <v-text-field
                    origin="center center"
                    :maxlength="25"
                    name="input-2"
                    label="Room name"
                    :autofocus="true"
                    v-on:keyup.enter.native="joinRoom()"
                    v-model="room"
                  ></v-text-field>
                </v-flex>
                <v-flex xs12>
                  <v-text-field
                    transition="v-scale-transition" origin="center center"
                    name="input-2"
                    label="Room password"
                    v-on:keyup.enter.native="joinRoom()"
                    v-model="password"
                  ></v-text-field>
                </v-flex>
                <v-flex xs4 offset-xs4>
                  <v-btn block color="primary" v-on:click.native="joinRoom()">Join</v-btn>
                </v-flex>
                <v-layout class="pt-3 text-xs-center" row wrap v-if="roomError">
                  <v-flex xs12 class="red--text">
                    <v-icon class="red--text">info</v-icon> {{ roomError }}
                  </v-flex>
                </v-layout>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-layout>
      </v-flex>
    </v-layout>

  </div>
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
      e1: 2,
      password: '',
      connectionPending: false,
      thisServer: window.location.origin,
      recents: null,

      ptservers: [
        {
          location: 'Sydney, Australia',
          text: 'SyncLounge AU1',
          value: 'https://v2au1.synclounge.tv',
          flag: 'flags/aus.png'
        },
        {
          location: 'Amsterdam, Netherlands',
          text: 'SyncLounge EU1',
          value: 'https://v2eu1.synclounge.tv',
          flag: 'flags/eu.png'
        },
        {
          location: 'Miami, United States',
          text: 'SyncLounge US1',
          value: 'https://v2us1.synclounge.tv',
          flag: 'flags/usa.png'
        },
        {
          location: 'Anywhere!',
          text: 'Custom Server',
          value: 'custom',
          flag: 'synclounge-white.png'
        }
      ]
    }
  },
  created: function () {
    if (this.slRoom && this.slConnected && this.slServer) {
      this.$router.push('/browse')
    }
    this.recents = JSON.parse(window.localStorage.getItem('recentrooms'))
  },
  methods: {
    serverSelected: function (server) {
      this.selectedServer = server.value
      if (this.selectedServer !== 'custom') {
        this.attemptConnect()
      }
    },
    attemptConnect: function () {
      // Attempt the connection
      return new Promise((resolve, reject) => {
        this.serverError = null
        console.log('Connecting to', this.selectedServer)
        if (this.selectedServer !== 'custom') {
          this.connectionPending = true
          this.$store.dispatch('socketConnect', { address: this.selectedServer })
            .then(result => {
              console.log('Connection done', result)
              this.connectionPending = false
              if (result) {
                console.log('Resuming')
                resolve()
              } else {
                this.serverError = null
                reject(result)
              }
            })
            .catch((e) => {
              this.connectionPending = false
              this.serverError = 'Failed to connect to ' + this.selectedServer
              reject(e)
            })
        } else {
          reject(new Error('Custom error: wrong function'))
        }
      })
    },
    attemptConnectCustom: function () {
      this.connectionPending = true
      this.serverError = null
      this.$store.dispatch('socketConnect', { address: this.CUSTOMSERVER }).then(result => {
        this.connectionPending = false
        if (result) {
          this.serverError = 'Failed to connect to ' + this.CUSTOMSERVER
        } else {
          this.serverError = null
        }
      })
        .catch(() => {
          this.serverError = 'Failed to connect to ' + this.CUSTOMSERVER
        })
    },
    recentConnect: async function (recent) {
      console.log('Attempting to connect to', recent)
      this.selectedServer = recent.server
      this.room = recent.room
      this.password = recent.password
      await this.attemptConnect()
      this.joinRoom().then(() => {
        console.log('Done joining room')
      }).catch((e) => {
        console.log('Unable to join room', e)
      })
    },
    joinRoom: function () {
      return new Promise((resolve, reject) => {
        if (!this.context.getters.getConnected) {
          return reject(new Error('Not connected to a server'))
        }
        if (this.room === '' || this.room == null) {
          this.roomError = 'You must enter a room name!'
          return reject(new Error('No room specified'))
        }
        let temporaryObj = {
          user: this.plex.user,
          roomName: this.room.toLowerCase(),
          password: this.password
        }
        this.$store.dispatch('joinRoom', temporaryObj).then(() => {
          resolve()
        }).catch(e => {
          this.roomError = e
          return reject(e)
        })
      })
    }
  },
  watch: {
    selectedServer: function () {
      // this.attemptConnect()
      this.serverError = null
    },
    slRoom: function () {
      if (this.slServer && this.slRoom) {
        this.$router.push('/browse')
      }
    }
  },
  computed: {
    plex: function () {
      return this.$store.state.plex
    },
    logo: function () {
      return this.logos.light.long
    },
    context: function () {
      return this.$store
    },
    recentsSorted: function () {
      if (!this.recents) {
        return []
      }
      let arr = []
      for (let i in this.recents) {
        let item = this.recents[i]
        arr.push(item)
      }
      arr = arr.sort((a, b) => {
        return b.time - a.time
      })
      if (arr.length > 3) {
        return arr.slice(0, 3)
      }
      return arr
    },
    CUSTOMSERVER: {
      get () {
        if (!this.$store.getters.getSettings['CUSTOMSERVER']) {
          return 'http://'
        }
        return this.$store.getters.getSettings['CUSTOMSERVER']
      },
      set (value) {
        this.$store.commit('setSetting', ['CUSTOMSERVER', value])
      }
    }
  }
}
</script>
<style>
  .flag {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: auto
  }
</style>
