<template>
  <v-navigation-drawer
    app
    temporary
    :value="isLeftSidebarOpen"
    disable-route-watcher
    @input="SET_LEFT_SIDEBAR_OPEN"
  >
    <v-list-item v-if="GET_PLEX_USER">
      <v-list-item-avatar>
        <v-img
          :src="GET_PLEX_USER.thumb"
        />
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title style="font-weight: bold;">
          {{ GET_PLEX_USER.username }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider />

    <v-list
      dense
      nav
    >
      <v-subheader>Preferences</v-subheader>
      <v-list-item @click.stop="ptsettingstoggle = !ptsettingstoggle">
        <v-list-item-icon>
          <v-icon color="white">
            settings
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>SyncLounge Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        @click.stop="plexsettingstoggle = !plexsettingstoggle"
      >
        <v-list-item-icon>
          <v-icon color="white">
            settings
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>Plex Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader>
        Account
      </v-subheader>

      <v-list-item
        :router="true"
        to="/signout"
      >
        <v-list-item-icon>
          <v-icon color="white">
            cancel
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>Sign out</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-subheader>About</v-subheader>

      <v-list-item
        :href="GET_RELEASE_URL"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon color="white">
            info
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>SyncLounge v{{ GET_VERSION }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        :href="GET_DISCORD_URL"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon color="white">
            chat
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>Discord</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        :href="GET_REPOSITORY_URL"
        target="_blank"
      >
        <v-list-item-icon>
          <v-icon color="white">
            code
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>GitHub</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <donate #default="{ on, attrs }">
        <v-list-item
          v-bind="attrs"
          v-on="on"
        >
          <v-list-item-icon>
            <v-icon color="white">
              favorite
            </v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Donate</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </donate>

      <v-spacer />
    </v-list>

    <template #append>
      <v-divider />
      <div
        class="text-center pa-2"
        style="opacity: 0.7; font-size: 12px;"
      >
        <div>Build #<a :href="GET_COMMIT_URL">{{ GET_GIT_HASH.substring(0, 7) }}</a></div>
        <div>Last updated {{ updatedAt }}</div>
      </div>
    </template>

    <v-dialog
      v-model="ptsettingstoggle"
      width="350"
    >
      <v-card
        class="pa-3"
      >
        <div class="text-center">
          <h2>SyncLounge Settings</h2>
        </div>

        <v-divider class="mt-2 mb-2" />
        <settings class="darken-4 pa-1" />
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="plexsettingstoggle"
      width="350"
    >
      <v-card
        class="pa-3"
      >
        <div class="text-center">
          <h2>Plex Settings</h2>
        </div>

        <v-divider class="mt-2 mb-2" />
        <plexsettings
          class="darken-4 pa-1"
        />
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import { formatDistanceToNow } from 'date-fns';

export default {
  components: {
    settings: () => import('@/components/settings.vue'),
    plexsettings: () => import('@/components/plex/plexsettings.vue'),
    donate: () => import('@/components/donate.vue'),
  },

  data() {
    return {
      ptsettingstoggle: false,
      plexsettingstoggle: false,
    };
  },

  computed: {
    ...mapState(['isLeftSidebarOpen']),

    ...mapGetters([
      'GET_REPOSITORY_URL',
      'GET_VERSION',
      'GET_GIT_HASH',
      'GET_DISCORD_URL',
      'GET_RELEASE_URL',
      'GET_COMMIT_URL',
    ]),

    ...mapGetters('plex', [
      'GET_PLEX_USER',
    ]),

    date() {
      return new Date(parseInt(process.env.VUE_APP_GIT_DATE, 10) * 1000);
    },

    updatedAt() {
      return `${formatDistanceToNow(this.date)} ago`;
    },
  },

  methods: {
    ...mapActions(['SET_LEFT_SIDEBAR_OPEN']),

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
