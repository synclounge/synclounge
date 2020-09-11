<template>
  <v-navigation-drawer
    :value="isRightSidebarOpen"
    style="z-index: 6;"
    app
    right
    class="pa-0"
    width="300"
    @input="SET_RIGHT_SIDEBAR_OPEN"
  >
    <template #prepend>
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
          <chatsettings #default="{ on, attrs }">
            <v-btn
              icon
              class="ma-0 pa-0"
              dark
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>more_vert</v-icon>
            </v-btn>
          </chatsettings>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item dense>
        <v-switch
          v-if="AM_I_HOST"
          class="pa-0 ma-0"
          label="Party Pausing"
          :input-value="IS_PARTY_PAUSING_ENABLED"
          @change="SEND_SET_PARTY_PAUSING_ENABLED"
        />

        <v-list-item-content
          v-if="!AM_I_HOST && GET_HOST_USER.state === 'stopped'"
        >
          <v-list-item-subtitle>
            Waiting for {{ GET_HOST_USER ? GET_HOST_USER.username : 'host' }} to start
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-tooltip
        v-if="AM_I_HOST"
        bottom
      >
        <template #activator="{ on, attrs }">
          <v-list-item
            dense
            v-bind="attrs"
            v-on="on"
          >
            <v-switch
              class="pa-0 ma-0"
              label="Auto Host"
              :input-value="IS_AUTO_HOST_ENABLED"
              @change="SEND_SET_AUTO_HOST_ENABLED"
            />
          </v-list-item>
        </template>

        <span>Automatically transfers host to other users when they play something new</span>
      </v-tooltip>

      <v-list-item
        v-if="(!AM_I_HOST || usingPlexClient)
          && GET_HOST_USER && GET_HOST_USER.state !== 'stopped'"
        dense
      >
        <v-tooltip
          bottom
          color="rgb(44, 44, 49)"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              color="primary"
              :disabled="!IS_PARTY_PAUSING_ENABLED"
              v-on="on"
              @click="sendPartyPause(GET_HOST_USER.state === 'playing')"
            >
              <v-icon v-if="GET_HOST_USER.state === 'playing'">
                pause
              </v-icon>

              <v-icon v-else>
                play_arrow
              </v-icon>
            </v-btn>
          </template>

          <span>Party Pausing is currently {{
            IS_PARTY_PAUSING_ENABLED ? 'enabled' : 'disabled' }} by the host</span>
        </v-tooltip>
      </v-list-item>

      <v-divider />
    </template>

    <div
      style="height: 100%;"
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
              style="font-size: 26px;
                opacity: 0.8;
                position: absolute;
                background-color: rgba(0, 0, 0, 0.7);"
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
              <template #activator="{ on, attrs }">
                <div
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-list-item-title>
                    {{ user.username }}
                    <span
                      v-if="id === GET_SOCKET_ID"
                      style="opacity: 0.6;"
                    >
                      (you)
                    </span>
                  </v-list-item-title>

                  <v-list-item-subtitle style="opacity: 0.6; color: white; font-size: 70%;">
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
              style="font-size: 70%;"
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
              <template #activator="{ on, attrs }">
                <v-icon
                  v-bind="attrs"
                  style="color: #e5a00d;"
                  v-on="on"
                  @click="AM_I_HOST && id !== GET_HOST_ID ? TRANSFER_HOST(id) : null"
                >
                  {{ getHostIconName(id === GET_HOST_ID) }}
                </v-icon>
              </template>

              <span>{{ getHostActionText(id === GET_HOST_ID) }}</span>
            </v-tooltip>

            <v-tooltip
              v-if="id !== GET_HOST_ID && AM_I_HOST"
              bottom
              color="rgb(44, 44, 49)"
              multi-line
              class="userlist"
            >
              <template #activator="{ on, attrs }">
                <v-icon
                  v-bind="attrs"
                  v-on="on"
                  @click="KICK_USER(id)"
                >
                  clear
                </v-icon>
              </template>

              <span>Kick</span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-divider />

      <messages
        class="messages"
      />
    </div>

    <template #append>
      <MessageInput />
    </template>
  </v-navigation-drawer>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';

import contentTitle from '@/mixins/contentTitle';
import { slPlayerClientId } from '@/player/constants';

export default {
  components: {
    messages: () => import('@/components/messaging/messages.vue'),
    MessageInput: () => import('@/components/messaging/MessageInput.vue'),
    chatsettings: () => import('@/components/chatsettings.vue'),
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
    };
  },

  computed: {
    ...mapState(['isRightSidebarOpen']),
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
    ]),

    ...mapGetters('synclounge', [
      'IS_PARTY_PAUSING_ENABLED',
      'IS_AUTO_HOST_ENABLED',
      'GET_USERS',
      'GET_ROOM',
      'GET_HOST_USER',
      'GET_HOST_ID',
      'AM_I_HOST',
      'GET_SOCKET_ID',
      'GET_ADJUSTED_HOST_TIME',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

    usingPlexClient() {
      return this.GET_CHOSEN_CLIENT_ID !== slPlayerClientId;
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
      'SEND_SET_AUTO_HOST_ENABLED',
      'sendPartyPause',
      'TRANSFER_HOST',
      'KICK_USER',
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

    getSyncStateColor({ syncFlexibility, ...rest }) {
      if (!this.GET_HOST_USER) {
        return '#F44336';
      }

      const difference = Math.abs(this.getAdjustedTime(rest) - this.GET_ADJUSTED_HOST_TIME());

      return difference > syncFlexibility
        ? '#FFB300'
        : '#0de47499';
    },

    getImgStyle(user) {
      return [
        {
          border: `3px solid ${this.getSyncStateColor(user)}`,
        },
      ];
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
.user-list,
.messages {
  overflow-y: auto;
}

.user-list {
  max-height: calc(50vh - 154px);
}

.messages {
  flex: 1 1 0;
}

.participant-count {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.7);
}

.v-list__tile {
  padding: 0;
}
</style>
