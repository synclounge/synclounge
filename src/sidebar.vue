<template>
  <v-container class="pa-0 pb-0" fill-height>
    <v-layout v-if="ptRoom" row wrap>
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
        <v-subheader>
          <v-container class="pa-0" justify-center align-center>
            <v-layout row wrap align-center justify-center>
              <v-flex xs6>
                Users ({{ ptUsers.length }})
              </v-flex>
              <v-flex xs6>
                <v-switch
                  class="pa-0 ma-0 party-pausing-label"
                  label="Party Pausing"
                  style="font-size: 12px !important;"
                  v-if="isHost(me)"
                  v-model="partyPausing"
                ></v-switch>
                <v-tooltip
                  bottom
                  color="light-blue darken-4"
                  v-else
                >
                  <v-btn
                    color="primary"
                    slot="activator"
                    :disabled="!partyPausing"
                    block
                    @click="sendPartyPauseLocal()"
                  >
                    Pause
                  </v-btn>
                  <span> Party Pausing is currently {{ partyPausing ? 'enabled' : 'disabled' }} by the host </span>
                </v-tooltip>
              </v-flex>
            </v-layout>
          </v-container>
        </v-subheader>
        <v-list dense two-line style="overflow: auto; max-height: calc(50vh - 84px); background: none">
          <div v-for="user in ptUsers" v-bind:key="user.username" style="position:relative;height:7em">
            <v-list-tile avatar style="height:4em" class="pb-0 mb-0" tag="div">
              <v-list-tile-avatar v-on:dblclick="transferHost(user.username)">
                <img v-bind:src="user.avatarUrl"  :style="getImgStyle(user)">
                  <v-icon v-if="user.playerState !== 'playing'" style="font-size: 26px; opacity: 0.8; position: absolute;background-color: rgba(0,0,0,0.7)">
                    {{ playerState(user) }}
                  </v-icon>
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
            <span style="float: left; font-size:70%" class="ptuser-time pl-2">{{ getCurrent(user) }}</span>
            <span style="float: right; font-size:70%" class="ptuser-maxTime pr-2">{{ getMax(user) }}</span>
            <v-progress-linear class="pt-content-progress " :height="2" :value="percent(user)"></v-progress-linear>
          </div>
        </div>
        </v-list>
      </v-flex>
      <v-flex xs12 style="position: relative; height: 50vh; max-height: 50vh">
        <v-layout row wrap style="height: 100%">
          <v-flex style="height: calc(100% - 96px); max-height: calc(100% - 96px)">
            <v-divider></v-divider>
            <v-subheader>Messages</v-subheader>
            <v-layout row wrap id="chatbox" style="max-height: calc(100% - 48px); overflow-y: auto">
              <v-flex align-center xs12 class="pb-1" :id="getMsgId(msg)" v-for="(msg, index) in messages" :key="index">
                <v-layout row wrap justify-start>
                  <v-flex xs3 class="text-xs-center">
                    <img :src="msg.user.thumb || msg.user.avatarUrl" style="width: 36px; height: 36px; border-radius: 50%" />
                  </v-flex>
                  <v-flex xs9 class="pr-2">
                    <v-layout row wrap>
                      <v-flex><b style="opacity:1;font-size:80%; float:left"> {{ msg.user.username }}</b></v-flex>
                      <v-flex><span style="opacity:0.6;font-size:60%; float:right"> {{ msg.time}}</span></v-flex>
                      <v-flex xs12>
                        <div style="opacity:0.8;color:white;font-size:90%; max-width: 100%; word-wrap: break-word"> {{ msg.msg }}</div>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
                <v-layout row class="pt-1">
                  <v-divider style="opacity: 0.6"></v-divider>
                </v-layout>
              </v-flex>
            </v-layout>
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

import { mapActions, mapGetters } from 'vuex';

export default {
  components: {
  },
  data() {
    return {
      messageToBeSent: '',
      lastRecievedUpdate: new Date().getTime(),
      now: new Date().getTime(),

      localPauseTimeout: false,
    };
  },
  mounted() {
    setInterval(() => {
      this.now = new Date().getTime();
    }, 250);
  },
  watch: {
    messages() {
      const options = {
        container: '#chatbox',
        easing: 'linear',
        duration: 1,
        cancelable: false,
      };
      this.$scrollTo('#lastMessage', 5, options);
    },
    ptUsers: {
      deep: true,
      handler() {
        this.lastRecievedUpdate = new Date().getTime();
      },
    },
  },
  computed: {
    ...mapGetters(['getPartyPausing']),
    plex() {
      return this.$store.getters.getPlex;
    },
    me() {
      return this.$store.state.me;
    },
    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
    validPlex() {
      if (!this.$store.state.plex) {
        return false;
      }
      return true;
    },
    validDevices() {
      if (!this.plex) {
        return false;
      }
      return this.plex.gotDevices;
    },
    showBrowser() {
      return (
        this.chosenClient &&
        !this.chosenClient.clientPlayingMetadata &&
        this.ptRoom
      );
    },
    isPTPlayer() {
      return (
        this.chosenClient &&
        this.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10'
      );
    },
    showMetadata() {
      return (
        !this.isPTPlayer &&
        !this.showBrowser &&
        this.chosenClient &&
        this.chosenClient.clientPlayingMetadata
      );
    },
    darkMode() {
      return this.$store.getters.getSettingDARKMODE;
    },
    ptConnected() {
      return this.$store.getters.getConnected;
    },
    ptServer() {
      return this.$store.getters.getServer;
    },
    ptRoom() {
      return this.$store.getters.getRoom;
    },
    ptPassword() {
      return this.$store.getters.getPassword;
    },
    ptUsers() {
      return this.$store.getters.getUsers;
    },
    userCount() {
      const count = this.$store.getters.getUsers.length;
      if (count === 1) {
        return `${count} user`;
      }
      return `${count} users`;
    },
    chatBoxMessage() {
      return `Message ${this.$store.getters.getRoom}`;
    },
    playercount() {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return `(${this.$store.state.plex.clients.length})`;
      }
      return '';
    },
    servercount() {
      if (this.$store.state.plex && this.$store.state.plex.gotDevices) {
        return `(${this.$store.state.plex.servers.length})`;
      }
      return '';
    },
    showChatValue() {
      if (this.$store.getters.getShownChat) {
        return 'block';
      }
      return 'none';
    },
    serverDelay() {
      return Math.round(this.$store.state.synclounge.commands[Object.keys(this.$store.state.synclounge.commands).length - 1].difference);
    },
    messages() {
      return this.$store.getters.getMessages;
    },
    difference() {
      return Math.abs(this.now - this.lastRecievedUpdate);
    },
    partyPausing: {
      get() {
        if (this.localPauseTimeout) return false;
        return this.getPartyPausing();
      },
      set(value) {
        this.updatePartyPausing(value);
      },
    },
  },
  methods: {
    ...mapActions(['updatePartyPausing', 'sendPartyPause']),
    isHost(user) {
      return user.role === 'host';
    },
    sendPartyPauseLocal() {
      this.localPauseTimeout = true;
      setTimeout(() => {
        this.localPauseTimeout = false;
      }, 3000);
      this.sendPartyPause();
    },
    getUserColor(user) {
      if (user.status === 'good' || user.role === 'host') {
        return '#0de47499';
      }
      if (user.status === 'ok') {
        return '#0a630b';
      }
      if (user.status === 'notok') {
        return '#FFB300';
      }
      if (user.status === 'unknown' || user.status === 'error') {
        return '#F44336';
      }
    },
    getImgStyle(user) {
      const arr = [{
        border: `3px solid ${this.getUserColor(user)}`,
      }];
      return arr;
    },
    transferHost(username) {
      this.$store.dispatch('transferHost', username);
    },
    async handleDisconnect() {
      await this.$store.dispatch('disconnectServer');
      this.$router.push('/');
    },
    percent(user) {
      let perc = parseInt(user.time) / parseInt(user.maxTime) * 100;
      if (isNaN(perc)) {
        perc = 0;
      }
      return perc;
    },
    getMsgId(msg) {
      if (this.messages && msg === this.messages[this.messages.length - 1]) {
        return 'lastMessage';
      }
    },
    getCurrent(user) {
      if (isNaN(user.time) || user.time === 0 || !user.time) {
        return this.getTimeFromMs(0);
      }
      const time = parseInt(user.time);
      return this.getTimeFromMs(time);
      // if (user.playerState === 'playing') {
      //   time = Math.floor((Math.floor((time + parseInt(this.difference - this.serverDelay)) / 1000) * 1000))
      // }
      // return this.getTimeFromMs(time)
    },

    getMax(user) {
      if (isNaN(user.maxTime)) {
        return this.getTimeFromMs(0);
      }
      return this.getTimeFromMs(user.maxTime);
    },
    getTitle(user) {
      if (user.title && user.title.length > 0) {
        return user.title;
      }
      return 'Nothing';
    },
    sendMessage() {
      if (this.messageToBeSent === '') {
        return;
      }
      console.log(`We should send this message: ${this.messageToBeSent}`);
      this.$store.dispatch('sendNewMessage', this.messageToBeSent);
      this.messageToBeSent = '';
    },
    playerState(user) {
      if (user.playerState) {
        if (user.playerState === 'stopped') {
          return 'stop';
        }
        if (user.playerState === 'paused') {
          return 'pause';
        }
        if (user.playerState === 'playing') {
          return 'play_arrow';
        }
        if (user.playerState === 'buffering') {
          return 'av_timer';
        }
      }
      return 'stop';
    },
    getTimeFromMs(ms) {
      const hours = ms / (1000 * 60 * 60);
      const absoluteHours = Math.floor(hours);
      const h = absoluteHours > 9 ? absoluteHours : `0${absoluteHours}`;
      const minutes = (hours - absoluteHours) * 60;
      const absoluteMinutes = Math.floor(minutes);
      const m = absoluteMinutes > 9 ? absoluteMinutes : `0${absoluteMinutes}`;
      const seconds = (minutes - absoluteMinutes) * 60;
      const absoluteSeconds = Math.floor(seconds);
      const s = absoluteSeconds > 9 ? absoluteSeconds : `0${absoluteSeconds}`;
      return `${h}:${m}:${s}`;
    },
  },
};
</script>
<style>
.wideinput .input-group--text-field.input-group--prepend-icon .input-group__details {
  margin-left: unset;
  max-width: unset;
}
.wideinput .input-group__details {
  display: none;
}
.party-pausing-label label {
  font-size: 12px !important;
}
.party-pausing-label .v-messages {
  display: none;
}
.party-pausing-label .v-input__slot {
  margin: 0;
}

</style>
