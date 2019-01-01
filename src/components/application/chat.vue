<template>
  <v-container class="pa-0 pb-0" fill-height>
    <v-layout v-if="ptRoom" row wrap justify-space-around align-content-end>
      <v-flex xs12 style="position: relative">
        <v-layout row wrap style="height: 100%">
          <v-flex style="height: calc(100% - 96px); max-height: calc(100% - 96px)" :style="chatboxStyle">
            <v-divider></v-divider>
            <v-subheader>Messages</v-subheader>
            <v-layout row wrap id="chatboxmobile" style="max-height: calc(100% - 48px); overflow-y: auto">
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
  props: {
    chatMaxHeight: {
      type: Number,
      default: 300,
    }
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
        container: '#chatboxmobile',
        easing: 'linear',
        duration: 1,
        cancelable: false,
      };
      this.$scrollTo('#lastMessageChat', 1, options);
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
    chatboxStyle() {
      return {
        'max-height': (this.chatMaxHeight + 'px') || 'unset',
      };
    },
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
    getImgStyle(user) {
      const arr = [{
        border: `3px solid ${this.getUserColor(user)}`,
      }];
      return arr;
    },
    getMsgId(msg) {
      if (this.messages && msg === this.messages[this.messages.length - 1]) {
        return 'lastMessageChat';
      }
    },
    sendMessage() {
      if (this.messageToBeSent === '') {
        return;
      }
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
.wideinput
  .input-group--text-field.input-group--prepend-icon
  .input-group__details {
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
