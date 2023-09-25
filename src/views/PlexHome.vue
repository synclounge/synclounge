<template>
  <v-container fluid>
    <PlexOnDeck :machine-identifier="GET_LAST_SERVER_ID">
      <template #header>
        Continue watching from {{ GET_LAST_SERVER.name }}
      </template>
    </PlexOnDeck>

    <v-divider />

    <v-subheader>
      Browse
      <v-btn
        x-small
        icon
        @click="FETCH_PLEX_DEVICES"
      >
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-subheader>

    <v-row>
      <v-col
        v-if="!GET_PLEX_SERVERS.length"
        cols="12"
        class="text-h5 primary--text"
      >
        No Plex Servers found.
        Make sure your server owner has shared libraries with you!
      </v-col>

      <v-col
        v-for="server in GET_PLEX_SERVERS"
        :key="server.clientIdentifier"
        cols="12"
        md="6"
        lg="4"
        xl="3"
      >
        <v-card
          :to="linkWithRoom(
            { name: 'PlexServer', params: { machineIdentifier: server.clientIdentifier } },
          )"
          style="background: rgb(0 0 0 / 60%);"
          :title="server.name"
        >
          <v-container fill-height>
            <v-row
              dense
              justify="center"
              align="center"
            >
              <v-col cols="4">
                <v-img
                  src="@/assets/images/logos/plexlogo.png"
                  height="110px"
                  contain
                />
              </v-col>

              <v-col
                cols="8"
                class="pl-2"
              >
                <div>
                  <div class="text-truncate text-h5">
                    {{ server.name }}
                  </div>

                  <div class="text--secondary text-caption">
                    v{{ server.productVersion }}
                  </div>

                  <div class="text-subtitle-2">
                    Owned by {{ ownerOfServer(server) }}
                  </div>

                  <div
                    v-if="!server.chosenConnection"
                    class="error--text"
                  >
                    Unable to connect.
                    Try disabling your adblocker
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import linkWithRoom from '@/mixins/linkwithroom';

export default {
  name: 'PlexHome',

  components: {
    PlexOnDeck: () => import('@/components/PlexOnDeck.vue'),
  },

  mixins: [
    linkWithRoom,
  ],

  data: () => ({
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_LAST_SERVER',
      'GET_LAST_SERVER_ID',
      'GET_PLEX_SERVERS',
    ]),
  },

  async created() {
    this.SET_ACTIVE_METADATA(null);
    await this.fetchRandomBackground();
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    ownerOfServer({ owned, sourceTitle }) {
      return owned
        ? 'you'
        : sourceTitle;
    },

    async fetchRandomBackgroundCriticalSection(signal) {
      await this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({
        signal,
      });
    },

    async fetchRandomBackground() {
      this.abortRequests();

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.fetchRandomBackgroundCriticalSection(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>
