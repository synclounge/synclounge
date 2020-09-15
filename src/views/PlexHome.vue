<template>
  <v-container fluid>
    <template
      v-if="subsetOnDeck.length"
    >
      <v-row no-gutters>
        <v-col>
          <v-subheader>
            Continue watching from {{ GET_LAST_SERVER.name }}
          </v-subheader>
        </v-col>

        <v-col
          cols="auto"
          class="ml-auto"
        >
          <v-btn
            icon
            :style="onDeckDownStyle"
            @click="onDeckDown"
          >
            <v-icon>navigate_before</v-icon>
          </v-btn>

          <v-btn
            icon
            :style="onDeckUpStyle"
            @click="onDeckUp"
          >
            <v-icon>navigate_next</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <v-row
        justify="center"
      >
        <v-col
          v-for="content in subsetOnDeck"
          :key="content.ratingKey"
          cols="12"
          sm="4"
          md="3"
          xl="2"
        >
          <PlexThumbnail
            :content="content"
            :machine-identifier="GET_LAST_SERVER_ID"
            type="art"
            cols="12"
            sm="4"
            md="3"
            xl="2"
          />
        </v-col>
      </v-row>
    </template>

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
          :to="{ name: 'PlexServer', params: { machineIdentifier: server.clientIdentifier }}"
          style="background: rgba(0, 0, 0, 0.6);"
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

export default {
  name: 'PlexHome',

  components: {
    PlexThumbnail: () => import('@/components/PlexThumbnail.vue'),
  },

  data: () => ({
    onDeckOffset: 0,
    onDeck: null,
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_LAST_SERVER',
      'GET_LAST_SERVER_ID',
      'GET_PLEX_SERVERS',
    ]),

    onDeckItemsPer() {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs':
          return 1;
        case 'sm':
          return 3;
        case 'md':
        case 'lg':
          return 4;
        default:
          return 6;
      }
    },

    onDeckUpStyle() {
      if (this.onDeckOffset + 3 >= this.onDeck.length) {
        return {
          opacity: 0.5,
        };
      }

      return {};
    },

    onDeckDownStyle() {
      if (this.onDeckOffset === 0) {
        return {
          opacity: 0.5,
        };
      }

      return {};
    },

    subsetOnDeck() {
      if (!this.onDeck) {
        return [];
      }
      return this.onDeck.slice(
        this.onDeckOffset,
        this.onDeckOffset + this.onDeckItemsPer,
      );
    },
  },

  watch: {
    GET_LAST_SERVER_ID: {
      handler() {
        if (this.GET_LAST_SERVER_ID) {
          this.fetchOnDeck();
        }
      },
      immediate: true,
    },

  },

  created() {
    this.SET_ACTIVE_METADATA(null);
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_ON_DECK',
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

    async fetchOnDeckCriticalSection(signal) {
      this.onDeck = await this.FETCH_ON_DECK({
        machineIdentifier: this.GET_LAST_SERVER_ID,
        start: 0,
        size: 10,
        signal,
      });
    },

    async fetchOnDeck() {
      this.abortRequests();

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.fetchOnDeckCriticalSection(controller.signal);
        await this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({ signal: controller.signal });
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },

    onDeckDown() {
      if (!this.onDeck) {
        return;
      }

      if (this.onDeckOffset - 4 < 0) {
        this.onDeckOffset = 0;
      } else {
        this.onDeckOffset -= 4;
      }
    },

    onDeckUp() {
      if (!this.onDeck) {
        return;
      }

      if (this.onDeckOffset + 4 >= this.onDeck.length) {
        // This would overflow!
      } else {
        this.onDeckOffset += 4;
      }
    },

    ownerOfServer({ owned, sourceTitle }) {
      return owned
        ? 'you'
        : sourceTitle;
    },
  },
};
</script>
