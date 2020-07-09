<template>
  <v-navigation-drawer
    v-if="IS_IN_ROOM"
    :value="isRightSidebarOpen"
    style="z-index: 6"
    app
    right
    class="pa-0"
    width="300"
    @input="SET_RIGHT_SIDEBAR_OPEN"
  >
    <template v-slot:prepend>
      <v-list-item three-line>
        <v-list-item-content>
          <v-list-item-title>{{ GET_ROOM }}</v-list-item-title>

          <v-list-item-subtitle
            v-if="Object.keys(GET_USERS).length != 1"
            class="participant-count"
          >
            {{ Object.keys(GET_USERS).length }} people
          </v-list-item-subtitle>

          <v-list-item-subtitle
            v-else
            class="participant-count"
          >
            It's just you, invite some friends
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-icon>
          <v-menu>
            <template v-slot:activator="{ on }">
              <v-btn
                icon
                class="ma-0 pa-0"
                dark
                v-on="on"
              >
                <v-icon>more_vert</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item @click="handleDisconnect">
                <v-list-item-title class="user-menu-list">
                  Leave Room
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item>
        <v-switch
          v-if="AM_I_HOST"
          class="pa-0 mt-2 party-pausing-label"
          label="Party Pausing"
          :input-value="IS_PARTY_PAUSING_ENABLED"
          @change="SEND_SET_PARTY_PAUSING_ENABLED"
        />

        <v-tooltip
          v-else-if="GET_HOST_USER.state !== 'stopped'"
          bottom
          color="rgb(44, 44, 49)"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              color="primary"
              :disabled="!canPause"
              style="min-width: 0; float: right;"
              v-on="on"
              @click="sendPartyPauseLocal(GET_HOST_USER.state === 'playing')"
            >
              <v-icon v-if="GET_HOST_USER.state === 'playing'">
                pause
              </v-icon>

              <v-icon v-else>
                play_arrow
              </v-icon>
            </v-btn>
          </template>

          <span>Party Pausing is currently {{ canPause ? 'enabled' : 'disabled' }} by the
            host</span>
        </v-tooltip>

        <v-list-item-content
          v-else
        >
          <v-list-item-subtitle>
            Waiting for {{ GET_HOST_USER.username }} to start
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider />
    </template>

    <div
      style="height: 100%"
      class="d-flex flex-column"
    >
      <v-list
        class="user-list"
        dense
        two-line
      >
        <v-list-item
          v-for="(user, id) in GET_USERS"
          :key="id"
        >
          <v-list-item-avatar>
            <img
              :src="user.thumb"
              :style="getImgStyle(user)"
            >

            <v-icon
              v-if="user.state !== 'playing'"
              style="font-size: 26px; opacity: 0.8; position: absolute;
                background-color: rgba(0,0,0,0.7)"
            >
              {{ stateIcons[user.state] }}
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-tooltip
              bottom
              color="rgb(44, 44, 49)"
              multi-line
              class="userlist"
            >
              <template v-slot:activator="{ on, attrs }">
                <div
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-list-item-title>
                    {{ user.username }}
                    <span
                      v-if="id === GET_SOCKET_ID"
                      style="opacity: 0.6"
                    >
                      (you)
                    </span>
                  </v-list-item-title>

                  <v-list-item-subtitle style="opacity:0.6;color:white;font-size:70%">
                    {{ getTitle(user.media) }}
                  </v-list-item-subtitle>
                </div>
              </template>

              Watching on {{ user.playerProduct || `Unknown Plex Client` }}
              <span v-if="user.media && GET_PLEX_SERVER(user.media.machineIdentifier)">
                <br>
                via {{ GET_PLEX_SERVER(user.media.machineIdentifier).name }}
              </span>
            </v-tooltip>

            <div
              style="font-size:70%"
              class="d-flex justify-space-between"
            >
              <div>
                {{ getTimeFromMs(getAdjustedTime(user)) }}
              </div>

              <div>
                {{ getTimeFromMs(user.duration) }}
              </div>
            </div>

            <v-progress-linear
              class="pt-content-progress"
              :height="2"
              :value="percent(user)"
            />
          </v-list-item-content>

          <v-list-item-action>
            <v-tooltip
              v-if="id === GET_HOST_ID || AM_I_HOST"
              bottom
              color="rgb(44, 44, 49)"
              multi-line
              class="userlist"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-icon
                  v-bind="attrs"
                  style="color: #E5A00D"
                  v-on="on"
                  @click="AM_I_HOST && id !== GET_HOST_ID ? TRANSFER_HOST(id) : null"
                >
                  {{ getHostIconName(id === GET_HOST_ID) }}
                </v-icon>
              </template>

              <span>{{ getHostActionText(id === GET_HOST_ID) }}</span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-divider />

      <messages
        v-if="$vuetify.breakpoint.lgAndUp"
        class="messages"
      />
    </div>

    <template v-slot:append>
      <MessageInput />
    </template>
  </v-navigation-drawer>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';

import contentTitle from '@/mixins/contentTitle';

export default {
  components: {
    messages: () => import('@/components/messages.vue'),
    MessageInput: () => import('@/components/MessageInput.vue'),
  },

  mixins: [
    contentTitle,
  ],

  data() {
    return {
      stateIcons: {
        stopped: 'stop',
        paused: 'pause',
        playing: 'play_arrow',
        buffering: 'av_timer',
      },
      timeUpdateIntervalId: null,

      // This is updated periodically and is what makes the player times advance (if playing)
      nowTimestamp: Date.now(),
      partyPauseCooldownRunning: false,
    };
  },

  computed: {
    ...mapState(['isRightSidebarOpen']),
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('synclounge', [
      'IS_PARTY_PAUSING_ENABLED',
      'GET_USERS',
      'GET_ROOM',
      'GET_HOST_USER',
      'GET_HOST_ID',
      'AM_I_HOST',
      'IS_IN_ROOM',
      'GET_SOCKET_ID',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

    canPause() {
      return !this.partyPauseCooldownRunning && this.IS_PARTY_PAUSING_ENABLED;
    },
  },

  created() {
    this.timeUpdateIntervalId = setInterval(() => {
      this.nowTimestamp = Date.now();
    }, this.GET_CONFIG.sidebar_time_update_interval);
  },

  beforeDestroy() {
    clearInterval(this.timeUpdateIntervalId);
  },

  methods: {
    ...mapActions('synclounge', [
      'SEND_SET_PARTY_PAUSING_ENABLED',
      'sendPartyPause',
      'TRANSFER_HOST',
      'DISCONNECT',
    ]),

    ...mapActions([
      'SET_RIGHT_SIDEBAR_OPEN',
    ]),

    getHostIconName(isHost) {
      return isHost
        ? 'star'
        : 'star_outline';
    },

    getHostActionText(isHost) {
      return isHost
        ? 'Host'
        : 'Transfer host';
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

      return '#F44336';
    },

    getImgStyle(user) {
      return [
        {
          border: `3px solid ${this.getUserColor(user)}`,
        },
      ];
    },

    async handleDisconnect() {
      await this.DISCONNECT();
      this.$router.push('/');
    },

    percent({ duration, ...rest }) {
      const perc = (this.getAdjustedTime(rest) / duration) * 100;
      if (Number.isNaN(perc)) {
        return 0;
      }

      return perc;
    },

    getTitle(media) {
      return media
        ? this.getCombinedTitle(media)
        : 'Nothing';
    },

    getAdjustedTime({
      updatedAt, state, time, playbackRate,
    }) {
      return state === 'playing'
        ? time + (this.nowTimestamp - updatedAt) * playbackRate
        : time;
    },

    getTimeFromMs(timeMs) {
      const displayTime = Math.round(timeMs / 1000);

      const h = Math.floor(displayTime / 3600);
      const m = Math.floor((displayTime / 60) % 60);
      let s = Math.floor(displayTime % 60);
      if (s < 10) {
        s = `0${s}`;
      }

      let text = `${m}:${s}`;
      if (displayTime > 3600) {
        if (m < 10) {
          text = `0${text}`;
        }
        text = `${h}:${text}`;
      }
      return text;
    },
  },
};
</script>

<style scoped>
.user-list, .messages {
  overflow-y: auto;
}

.user-list {
  max-height: calc(50vh - 154px);
}

.messages {
  flex: 1 1 0;
}

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
