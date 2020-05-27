<template>
  <v-navigation-drawer
    :value="isRightSidebarOpen"
    @input="SET_RIGHT_SIDEBAR_OPEN"
    style="padding: 0; z-index: 6"
    app
    right
  >
    <v-container class="pa-0 pb-0" fill-height>
      <v-layout v-if="getRoom" row wrap style="background: rgba(30, 31, 50,0.6)">
        <v-flex xs12 style="height: 50vh">
          <v-flex xs12>
            <v-card
              style="background: linear-gradient(180deg,#1f1c2c,#182848); border-radius: 7px"
              class="pa-2 ma-3"
            >
              <v-layout row wrap justify-space-between align-center>
                <v-flex xs6>
                  <h3 class="mb-0 pb-0 pa-0">{{ getRoom }}</h3>
                </v-flex>
                <v-flex xs2>
                  <v-menu>
                    <v-btn icon class="ma-0 pa-0" dark>
                      <v-icon>more_vert</v-icon>
                    </v-btn>
                    <v-list>
                      <v-list-item @click="handleDisconnect()">
                        <v-list-item-title class="user-menu-list">Leave Room</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-flex>
                <v-flex xs12>
                  <div v-if="getUsers.length != 1" class="participant-count">
                    {{ getUsers.length }} people
                  </div>
                  <div v-else class="participant-count">It's just you, invite some friends</div>
                </v-flex>
                <v-flex xs12>
                  <v-layout row wrap>
                    <v-flex xs6>
                      <v-switch
                        class="pa-0 mt-2 party-pausing-label"
                        label="Party Pausing"
                        v-if="isHost(me)"
                        :input-value="getPartyPausing"
                        @change="updatePartyPausing"
                      ></v-switch>
                      <v-tooltip bottom color="rgb(44, 44, 49)" v-else>
                        <v-btn
                          color="primary"
                          :disabled="!canPause"
                          style="min-width: 0; float: right;"
                          @click="sendPartyPauseLocal(playerState(getHostUser) === 'play_arrow')"
                          v-if="playerState(getHostUser) !== 'stop'"
                        >
                          <v-icon v-if="playerState(getHostUser) === 'play_arrow'">pause</v-icon>
                          <v-icon v-else>play_arrow</v-icon>
                        </v-btn>
                        <span
                          >Party Pausing is currently {{ canPause ? 'enabled' : 'disabled' }} by the
                          host</span
                        >
                      </v-tooltip>
                    </v-flex>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-card>
            <v-card
              style="background: #E5A00D; border-radius: 7px"
              class="pa-2 ma-3"
              v-if="me.role !== 'host' && this.$route.path.indexOf('/player') === -1"
            >
              <v-layout row wrap justify-space-between align-center>
                <v-flex xs12 class="text-center">
                  <span class="mb-0 pb-0 pa-0" style="color: rgb(44, 44, 49); "
                    >Waiting for {{ getHostUser.username }} to start</span
                  >
                </v-flex>
              </v-layout>
            </v-card>
          </v-flex>
          <v-list
            dense
            two-line
            style="overflow: auto; max-height: calc(50vh - 154px); background: none"
          >
            <v-card
              style="background: linear-gradient(180deg,#1f1c2c,#182848)!important; border-radius: 7px"
              class="pa-1 ml-3 mr-3"
            >
              <v-list-item style="height:4em" class="pl-1 pr-1 mb-0" tag="div">
                <v-list-item-avatar>
                  <img v-bind:src="getHostUser.avatarUrl" :style="getImgStyle(getHostUser)" />
                  <v-icon
                    v-if="getHostUser.playerState !== 'playing'"
                    style="font-size: 26px; opacity: 0.8; position: absolute;background-color: rgba(0,0,0,0.5)"
                    >{{ playerState(getHostUser) }}</v-icon
                  >
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-tooltip bottom color="rgb(44, 44, 49)" multi-line class="userlist">
                    <span>
                      <v-list-item-title>
                        {{ getHostUser.username }}
                        <span style="opacity: 0.6" v-if="getHostUser.uuid === me.uuid">(you)</span>
                      </v-list-item-title>
                      <v-list-item-subtitle style="opacity:0.6;color:white;font-size:70%">{{
                        getTitle(getHostUser)
                      }}</v-list-item-subtitle>
                    </span>
                    Watching on {{ getHostUser.playerProduct || 'Unknown Plex Client' }}
                    <span v-if="getPlex.servers[getHostUser.machineIdentifier]">
                      <br />
                      via {{ getPlex.servers[getHostUser.machineIdentifier].name }}
                    </span>
                  </v-tooltip>
                </v-list-item-content>
                <v-list-item-action>
                  <v-tooltip bottom color="rgb(44, 44, 49)" multi-line class="userlist">
                    <v-icon style="color: #E5A00D">star</v-icon>Host
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>
              <div class="pl-1 pr-1 pt-1 mt-0 pb-0 mb-0">
                <span style="float: left; font-size:70%" class="ptuser-time pl-1">{{
                  getCurrent(getHostUser)
                }}</span>
                <span style="float: right; font-size:70%" class="ptuser-maxTime pr-1">{{
                  getMax(getHostUser)
                }}</span>
                <v-progress-linear
                  class="pt-content-progress"
                  :height="2"
                  :value="percent(getHostUser)"
                ></v-progress-linear>
              </div>
            </v-card>
            <div v-for="user in getUsers" v-bind:key="user.username">
              <div class="pa-1 ml-3 mr-3" v-if="!isHost(user)">
                <v-list-item style="height:4em" class="pb-0 mb-0" tag="div">
                  <v-list-item-avatar v-on:dblclick="transferHost(user.username)">
                    <img v-bind:src="user.avatarUrl" :style="getImgStyle(user)" />
                    <v-icon
                      v-if="user.playerState !== 'playing'"
                      style="font-size: 26px; opacity: 0.8; position: absolute;background-color: rgba(0,0,0,0.7)"
                      >{{ playerState(user) }}</v-icon
                    >
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-tooltip bottom color="rgb(44, 44, 49)" multi-line class="userlist">
                      <span>
                        <v-list-item-title>
                          {{ user.username }}
                          <span style="opacity: 0.6" v-if="user.uuid === me.uuid">(you)</span>
                        </v-list-item-title>
                        <v-list-item-subtitle style="opacity:0.6;color:white;font-size:70%">{{
                          getTitle(user)
                        }}</v-list-item-subtitle>
                      </span>
                      Watching on {{ user.playerProduct || 'Unknown Plex Client' }}
                      <span v-if="getPlex.servers[user.machineIdentifier]">
                        <br />
                        via {{ getPlex.servers[user.machineIdentifier].name }}
                      </span>
                    </v-tooltip>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-tooltip bottom color="rgb(44, 44, 49)" multi-line class="userlist">
                      <v-icon v-if="isHost(user)" style="color: #E5A00D">star</v-icon>Host
                    </v-tooltip>
                    <v-menu v-if="user.uuid !== me.uuid && isHost(me)" :offset-y="true">
                      <v-btn icon class="ma-0 pa-0" dark>
                        <v-icon>more_vert</v-icon>
                      </v-btn>
                      <v-list>
                        <v-list-item @click="transferHost(user.username)">
                          <v-list-item-title class="user-menu-list">Make Host</v-list-item-title>
                        </v-list-item>
                        <!-- <v-list-item @click.stop="openInviteDialog(user)">
                        <v-list-item-title class="user-menu-list">Invite to a Plex Server</v-list-item-title>
                        </v-list-item>-->
                      </v-list>
                    </v-menu>
                  </v-list-item-action>
                </v-list-item>
                <div class="pl-0 pr-0 pt-1 mt-0 pb-0 mb-0">
                  <span style="float: left; font-size:70%" class="ptuser-time pl-1">{{
                    getCurrent(user)
                  }}</span>
                  <span style="float: right; font-size:70%" class="ptuser-maxTime pr-1">{{
                    getMax(user)
                  }}</span>
                  <v-progress-linear
                    class="pt-content-progress"
                    :height="2"
                    :value="percent(user)"
                  ></v-progress-linear>
                </div>
              </div>
            </div>
          </v-list>
        </v-flex>
        <v-flex xs12 style="position: relative; height: 50vh; max-height: 50vh">
          <messages v-if="$vuetify.breakpoint.lgAndUp"></messages>
        </v-flex>
      </v-layout>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';

import messages from '@/components/messages.vue';

export default {
  components: {
    messages,
  },
  data() {
    return {
      lastRecievedUpdate: new Date().getTime(),
      now: new Date().getTime(),

      partyPauseCooldownRunning: false,
    };
  },
  mounted() {
    setInterval(() => {
      this.now = new Date().getTime();
    }, 250);
  },
  watch: {
    getUsers: {
      deep: true,
      handler() {
        this.lastRecievedUpdate = new Date().getTime();
      },
    },
  },
  computed: {
    ...mapState(['me', 'isRightSidebarOpen']),
    ...mapGetters(['getPlex', 'getPartyPausing', 'getUsers', 'getRoom', 'getHostUser']),
    serverDelay() {
      return Math.round(
        this.$store.state.synclounge.commands[
          Object.keys(this.$store.state.synclounge.commands).length - 1
        ].difference,
      );
    },
    difference() {
      return Math.abs(this.now - this.lastRecievedUpdate);
    },
    canPause() {
      return !this.partyPauseCooldownRunning && this.getPartyPausing;
    },
  },
  methods: {
    ...mapActions([
      'updatePartyPausing',
      'sendPartyPause',
      'transferHost',
      'SET_RIGHT_SIDEBAR_OPEN',
    ]),
    isHost(user) {
      return user.role === 'host';
    },
    sendPartyPauseLocal(isPause) {
      this.partyPauseCooldownRunning = true;
      setTimeout(() => {
        this.partyPauseCooldownRunning = false;
      }, 3000);
      this.sendPartyPause(isPause);
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
      const arr = [
        {
          border: `3px solid ${this.getUserColor(user)}`,
        },
      ];
      return arr;
    },
    async handleDisconnect() {
      await this.$store.dispatch('disconnectServer');
      this.$router.push('/');
    },
    percent(user) {
      let perc = (parseInt(user.time) / parseInt(user.maxTime)) * 100;
      if (isNaN(perc)) {
        perc = 0;
      }
      return perc;
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
<style scoped>
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
.participant-count {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.7);
}
.v-list__tile {
  padding: 0;
}
.user-menu-list {
  padding: 0 16px;
}
</style>
