<template>
  <v-navigation-drawer
    v-if="GET_HOST_USER"
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
            v-if="GET_USERS.length != 1"
            class="participant-count"
          >
            {{ GET_USERS.length }} people
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
          v-if="isHost(GET_ME)"
          class="pa-0 mt-2 party-pausing-label"
          label="Party Pausing"
          :input-value="getPartyPausing"
          @change="updatePartyPausing"
        />

        <v-tooltip
          v-else-if="playerState(GET_HOST_USER) !== 'stop'"
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
              @click="sendPartyPauseLocal(playerState(GET_HOST_USER) === 'play_arrow')"
            >
              <v-icon v-if="playerState(GET_HOST_USER) === 'play_arrow'">
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
          v-for="user in GET_USERS"
          :key="user.username"
        >
          <v-list-item-avatar @dblclick="TRANSFER_HOST(user.username)">
            <img
              :src="user.avatarUrl"
              :style="getImgStyle(user)"
            >
            <v-icon
              v-if="user.playerState !== 'playing'"
              style="font-size: 26px; opacity: 0.8; position: absolute;
                background-color: rgba(0,0,0,0.7)"
            >
              {{ playerState(user) }}
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
                      v-if="user.uuid === GET_ME.uuid"
                      style="opacity: 0.6"
                    >
                      (you)
                    </span>
                  </v-list-item-title>

                  <v-list-item-subtitle style="opacity:0.6;color:white;font-size:70%">
                    {{ getTitle(user) }}
                  </v-list-item-subtitle>
                </div>
              </template>

              Watching on {{ user.playerProduct || `Unknown Plex Client` }}
              <span v-if="GET_PLEX_SERVER(user.machineIdentifier)">
                <br>
                via {{ GET_PLEX_SERVER(user.machineIdentifier).name }}
              </span>
            </v-tooltip>

            <div
              style="font-size:70%"
              class="d-flex justify-space-between"
            >
              <div>
                {{ getCurrent(user) }}
              </div>

              <div>
                {{ getMax(user) }}
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
              v-if="isHost(user) || AM_I_HOST"
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
                  @click="AM_I_HOST && !isHost(user) ? TRANSFER_HOST(user.username) : null"
                >
                  {{ getHostIconName(user) }}
                </v-icon>
              </template>

              <span>{{ getHostActionText(user) }}</span>
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

export default {
  components: {
    messages: () => import('@/components/messages.vue'),
    MessageInput: () => import('@/components/MessageInput.vue'),
  },

  data() {
    return {
      partyPauseCooldownRunning: false,
    };
  },

  computed: {
    ...mapState(['isRightSidebarOpen']),
    ...mapGetters('synclounge', [
      'GET_ME',
      'getPartyPausing',
      'GET_USERS',
      'GET_ROOM',
      'GET_HOST_USER',
      'AM_I_HOST',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

    canPause() {
      return !this.partyPauseCooldownRunning && this.getPartyPausing;
    },
  },

  methods: {
    ...mapActions('synclounge', [
      'updatePartyPausing',
      'sendPartyPause',
      'TRANSFER_HOST',
      'DISCONNECT',
    ]),

    ...mapActions([
      'SET_RIGHT_SIDEBAR_OPEN',
    ]),

    isHost(user) {
      return user.role === 'host';
    },

    getHostIconName(user) {
      return this.isHost(user)
        ? 'star'
        : 'star_outline';
    },

    getHostActionText(user) {
      return this.isHost(user)
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
      const arr = [
        {
          border: `3px solid ${this.getUserColor(user)}`,
        },
      ];
      return arr;
    },

    async handleDisconnect() {
      await this.DISCONNECT();
      this.$router.push('/');
    },

    percent(user) {
      let perc = (parseInt(user.time, 10) / parseInt(user.duration, 10)) * 100;
      if (Number.isNaN(perc)) {
        perc = 0;
      }
      return perc;
    },

    getCurrent(user) {
      if (Number.isNaN(user.time) || user.time === 0 || !user.time) {
        return this.getTimeFromMs(0);
      }
      const time = parseInt(user.time, 10);
      return this.getTimeFromMs(time);
    },

    getMax(user) {
      if (Number.isNaN(user.duration)) {
        return this.getTimeFromMs(0);
      }
      return this.getTimeFromMs(user.duration);
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
