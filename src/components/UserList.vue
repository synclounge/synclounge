<template>
  <v-list
    class="overflow-y-auto user-list"
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
          class="avatar-img"
          :class="getSyncBorderClass(user)"
        >

        <v-icon
          v-if="user.state !== 'playing'"
          class="avatar-icon"
        >
          {{ stateIcons[user.state] }}
        </v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-tooltip
          bottom
          multi-line
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
                  class="text--secondary"
                >
                  (you)
                </span>
              </v-list-item-title>

              <v-list-item-subtitle
                class="text--secondary text-tiny"
              >
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
          class="d-flex justify-space-between text-tiny"
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
          multi-line
        >
          <template #activator="{ on, attrs }">
            <v-icon
              color="primary"
              v-bind="attrs"
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
          multi-line
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
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import contentTitle from '@/mixins/contentTitle';

export default {
  name: 'UserList',

  mixins: [
    contentTitle,
  ],

  data: () => ({
    stateIcons: {
      stopped: 'stop',
      paused: 'pause',
      playing: 'play_arrow',
      buffering: 'av_timer',
    },
    timeUpdateIntervalId: null,

    // This is updated periodically and is what makes the player times advance (if playing)
    nowTimestamp: Date.now(),
  }),

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('synclounge', [
      'GET_USERS',
      'GET_ADJUSTED_HOST_TIME',
      'GET_HOST_USER',
      'GET_SOCKET_ID',
      'GET_HOST_ID',
      'AM_I_HOST',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
    ]),

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
      'TRANSFER_HOST',
      'KICK_USER',
    ]),

    getAdjustedTime({
      updatedAt, state, time, playbackRate,
    }) {
      return state === 'playing'
        ? time + (this.nowTimestamp - updatedAt) * playbackRate
        : time;
    },

    getSyncBorderClass({ syncFlexibility, ...rest }) {
      if (!this.GET_HOST_USER) {
        return 'border-error';
      }

      const difference = Math.abs(this.getAdjustedTime(rest) - this.GET_ADJUSTED_HOST_TIME());

      return difference > syncFlexibility
        ? 'border-desync'
        : 'border-sync';
    },

    getTitle(media) {
      return media
        ? this.getCombinedTitle(media)
        : 'Nothing';
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

    percent({ duration, ...rest }) {
      const perc = (this.getAdjustedTime(rest) / duration) * 100;
      if (Number.isNaN(perc)) {
        return 0;
      }

      return perc;
    },

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
  },
};
</script>

<style scoped>
.user-list {
  max-height: calc(50vh - 154px);
}

.avatar-img {
  border: 3px solid;
}

.avatar-icon {
  font-size: 26px;
  opacity: 0.8;
  position: absolute;
  background-color: rgb(0 0 0 / 70%);
}

.border-error {
  border-color: #f44336;
}

.border-desync {
  border-color: #ffb300;
}

.border-sync {
  border-color: #0de47499;
}

.text-tiny {
  font-size: 70% !important;
}
</style>
