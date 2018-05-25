<template>
  <v-container class="pa-1 pb-0" fill-height>
    <v-layout v-if="ptRoom" column>
      <v-flex xs12 style="height: 50vh">
        <v-flex xs12>
          <v-layout row wrap justify-space-between="" align-center>
            <v-flex xs8 offset-xs2 class="text-xs-center">
              <h3 class="mb-0 pb-0 pa-0"> Room {{ ptRoom }}</h3>
            </v-flex>
            <v-flex xs2>
              <v-menu>
                <v-btn icon slot="activator" class="ma-0 pa-0" dark>
                  <v-icon>more_vert</v-icon>
                </v-btn>
                <v-list>
                  <v-list-tile @click="handleDisconnect()">
                    <v-list-tile-title>Leave Room</v-list-tile-title>
                  </v-list-tile>
                </v-list>
              </v-menu>
            </v-flex>
          </v-layout>
        </v-flex>

        <v-subheader>Users ({{ ptUsers.length }})</v-subheader>
        <v-list dense two-line style="overflow-y:scroll; max-height: calc(50vh - 84px); background: none">
          <div v-for="user in ptUsers" v-bind:key="user.username" style="position:relative;height:7em">
            <v-list-tile avatar style="height:4em" class="pb-0 mb-0" tag="div">
              <v-list-tile-avatar v-on:dblclick="transferHost(user.username)">
                <img v-bind:src="user.avatarUrl"  :style="getImgStyle(user)">
                  <v-icon v-if="user.playerState !== 'playing'" style="font-size: 26px; opacity: 0.8; position: absolute;background-color: rgba(0,0,0,0.7)">{{ playerState(user) }}</v-icon>
                </img>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-tooltip bottom color="light-blue darken-4" multi-line class="userlist">
                  <span slot="activator">
                    <v-list-tile-title> {{ user.username }} <span style="opacity: 0.6" v-if="user.uuid === me.uuid"> (you) </span></v-list-tile-title>
                    <v-list-tile-sub-title style="opacity:0.6;color:white;font-size:70%">{{ getTitle(user) }}</v-list-tile-sub-title>
                  </span>
                  Watching on {{ user.playerProduct || 'Unknown Plex Client' }}
                  <span v-if="plex.servers[user.machineIdentifier]">
                    <br />via {{ plex.servers[user.machineIdentifier].name }}
                  </span>
                </v-tooltip>
              </v-list-tile-content>
              <v-list-tile-action  v-if="isHost(user)">
                <v-icon v-if="isHost(user)" style="color: #E5A00D">star</v-icon>
              </v-list-tile-action>
            </v-list-tile>
          <div class="pl-2 pr-2 pt-2 mt-0 pb-0 mb-0">
            <span style="float: left;font-size:70%" class="ptuser-time pl-2">{{ getCurrent(user) }}</span>
            <span style="float: right;font-size:70%" class="ptuser-maxTime pr-2">{{ getMax(user) }}</span>
            <v-progress-linear class="pt-content-progress " :height="2" :value="percent(user)"></v-progress-linear>
          </div>
        </div>
        </v-list>
      </v-flex>
      <v-flex xs12 style="position: relative; height: 50vh">
        <v-layout row wrap justify-space-around>
          <v-flex style="height: calc(100% - 96px)">  
            <v-divider></v-divider>
            <v-subheader>Messages</v-subheader>
            <v-list id="chatbox" style="overflow-y:scroll; background: none; max-height: calc(100% - 48px);">
              <v-list-tile  style=" position:relative; overflow-y: scroll" v-bind:id="getMsgId(msg)" v-for="(msg, index) in messages" v-bind:key="index" tag="div">
                <v-list-tile-avatar>
                  <img v-bind:src="msg.user.thumb || msg.user.avatarUrl" style="position:absolute;top:0; width: 36px; height: 36px;" />
                </v-list-tile-avatar>
                <v-list-tile-content>
                  <v-list-tile-title style="color:white; position:relative;">
                    <span style="opacity:1;font-size:80%; float:left"> {{ msg.user.username }}</span>
                    <span style="opacity:0.6;font-size:60%; float:right"> {{ msg.time}}</span>
                  </v-list-tile-title>
                  <v-list-tile-sub-title style="opacity:0.8;color:white;font-size:70%;"> {{ msg.msg }}</v-list-tile-sub-title>
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
          </v-flex>
          <v-flex>
            <v-text-field
              prepend-icon="message"
              :label="'Send a message to ' + '#' + ptRoom"
              hide-details
              class="ma-0 ml-1 pr-1 wideinput"
              v-on:keyup.enter.native="sendMessage()"
              v-model="messageToBeSent"
            ></v-text-field>
            <v-btn block color="primary" @click="sendMessage()">Send</v-btn>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  components: {
  },
  data () {
    return {
      messageToBeSent: ''
    }
  },
  watch: {
    messages: function () {
      var options = {
        container: '#chatbox',
        easing: 'linear',
        duration: 1,
        cancelable: false
      }
      this.$scrollTo('#lastMessage', 5, options)
    }
  },
  computed: {
    plex: function () {
      return this.$store.getters.getPlex
    },
    me: function () {
      return this.$store.state.me
    },
    chosenClient: function () {
      return this.$store.getters.getChosenClient
    },
    validPlex: function () {
      if (!this.$store.state.plex) {
        return false
      }
      return true
    },
    validDevices: function () {
      if (!this.plex) {
        return false
      }
      return this.plex.gotDevices
    },
    showBrowser () {
      return (
        this.chosenClient &&
        !this.chosenClient.clientPlayingMetadata &&
        this.ptRoom
      )
    },
    isPTPlayer () {
      return (
        this.chosenClient &&
        this.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10'
      )
    },
    showMetadata () {
      return (
        !this.isPTPlayer &&
        !this.showBrowser &&
        this.chosenClient &&
        this.chosenClient.clientPlayingMetadata
      )
    },
    darkMode: function () {
      return this.$store.getters.getSettingDARKMODE
    },
    ptConnected: function () {
      return this.$store.getters.getConnected
    },
    ptServer: function () {
      return this.$store.getters.getServer
    },
    ptRoom: function () {
      return this.$store.getters.getRoom
    },
    ptPassword: function () {
      return this.$store.getters.getPassword
    },
    ptUsers: function () {
      return this.$store.getters.getUsers
    },
    userCount: function () {
      let count = this.$store.getters.getUsers.length
      if (count === 1) {
        return count + ' user'
      }
      return count + ' users'
    },
    chatBoxMessage: function () {
      return 'Message ' + this.$store.getters.getRoom
    },
    playercount: function () {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return '(' + this.$store.state.plex.clients.length + ')'
      }
      return ''
    },
    servercount: function () {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return '(' + this.$store.state.plex.servers.length + ')'
      }
      return ''
    },
    showChatValue: function () {
      if (this.$store.getters.getShownChat) {
        return 'block'
      }
      return 'none'
    },
    messages: function () {
      return this.$store.getters.getMessages
    }
  },
  methods: {
    isHost: function (user) {
      return user.role === 'host'
    },
    getUserColor: function (user) {
      if (user.status === 'good' || user.role === 'host') {
        return '#0de47499'
      }
      if (user.status === 'ok') {
        return '#0a630b'
      }
      if (user.status === 'notok') {
        return '#FFB300'
      }
      if (user.status === 'unknown' || user.status === 'error') {
        return '#F44336'
      }
    },
    getImgStyle: function (user) {
      let arr = [{
        border: '2px solid ' + this.getUserColor(user)
      }]
      return arr
    },
    transferHost: function (username) {
      this.$store.dispatch('transferHost', username)
    },
    handleDisconnect: async function () {
      await this.$store.dispatch('disconnectServer')
      this.$router.push('/')
    },
    percent: function (user) {
      let perc = parseInt(user.time) / parseInt(user.maxTime) * 100
      if (isNaN(perc)) {
        perc = 0
      }
      return perc
    },
    getMsgId (msg) {
      if (this.messages && msg === this.messages[this.messages.length - 1]) {
        return 'lastMessage'
      }
    },
    getCurrent: function (user) {
      if (isNaN(user.time)) {
        return this.getTimeFromMs(0)
      }
      return this.getTimeFromMs(user.time)
    },
    getMax: function (user) {
      if (isNaN(user.maxTime)) {
        return this.getTimeFromMs(0)
      }
      return this.getTimeFromMs(user.maxTime)
    },
    getTitle: function (user) {
      if (user.title && user.title.length > 0) {
        return user.title
      }
      return 'Nothing'
    },
    sendMessage: function () {
      if (this.messageToBeSent === '') {
        return
      }
      console.log('We should send this message: ' + this.messageToBeSent)
      this.$store.dispatch('sendNewMessage', this.messageToBeSent)
      this.messageToBeSent = ''
    },
    playerState: function (user) {
      if (user.playerState) {
        if (user.playerState === 'stopped') {
          return 'stop'
        }
        if (user.playerState === 'paused') {
          return 'pause'
        }
        if (user.playerState === 'playing') {
          return 'play_arrow'
        }
      }
      return 'stop'
    },
    getTimeFromMs (ms) {
      var hours = ms / (1000 * 60 * 60)
      var absoluteHours = Math.floor(hours)
      var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours
      var minutes = (hours - absoluteHours) * 60
      var absoluteMinutes = Math.floor(minutes)
      var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes
      var seconds = (minutes - absoluteMinutes) * 60
      var absoluteSeconds = Math.floor(seconds)
      var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds
      return h + ':' + m + ':' + s
    }
  }
}
</script>
<style>
.wideinput .input-group--text-field.input-group--prepend-icon .input-group__details {
  margin-left: unset;
  max-width: unset;
}
.wideinput .input-group__details {
  display: none;
}

</style>
