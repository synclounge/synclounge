<template>
  <v-container
    class="pt-0"
    fluid
  >
    <v-subheader>
      Libraries
    </v-subheader>

    <v-row>
      <v-col
        v-for="library in libraries"
        :key="library.name"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-tooltip
          bottom
          nudge-top="10"
        >
          <template #activator="{ on, attrs }">
            <v-card
              :img="getArtLibrary(library)"
              v-bind="attrs"
              flat
              :to="linkWithRoom({
                name: 'PlexLibrary',
                params: {
                  machineIdentifier: machineIdentifier,
                  sectionId: library.key,
                },
              })"
              v-on="on"
            >
              <div class="hidden-xs-only pa-2">
                <v-img
                  height="75"
                  contain
                  :src="getThumb(library)"
                />
              </div>

              <v-card-title
                style="background: rgb(0 0 0 / 70%);"
                class="px-3 py-1"
              >
                <div class="text-subtitle-1">
                  {{ library.title }}
                </div>
              </v-card-title>
            </v-card>
          </template>

          <span>{{ library.title }}</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <PlexOnDeck :machine-identifier="machineIdentifier">
      <template #preHeader>
        <v-divider
          class="mt-3 ma-2"
        />
      </template>
    </PlexOnDeck>

    <PlexRecentlyAdded :machine-identifier="machineIdentifier">
      <template #preHeader>
        <v-divider
          class="mt-3 ma-2"
        />
      </template>
    </PlexRecentlyAdded>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { getAppWidth, getAppHeight } from '@/utils/sizing';
import linkWithRoom from '@/mixins/linkwithroom';

export default {
  name: 'PlexServer',

  components: {
    PlexOnDeck: () => import('@/components/PlexOnDeck.vue'),
    PlexRecentlyAdded: () => import('@/components/PlexRecentlyAdded.vue'),
  },

  mixins: [
    linkWithRoom,
  ],

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    libraries() {
      return this.GET_PLEX_SERVER(this.machineIdentifier).libraries
        ? Object.values(this.GET_PLEX_SERVER(this.machineIdentifier).libraries)
          .filter((library) => library.type !== 'artist'
            || library.agent !== 'tv.plex.agents.music')
        : [];
    },
  },

  watch: {
    machineIdentifier: {
      handler() {
        this.setupCrumbs();
        return this.fetchRandomBackground();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
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

    setupCrumbs() {
      this.SET_ACTIVE_METADATA({
        machineIdentifier: this.machineIdentifier,
      });
    },

    getArtLibrary(object) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: object.art,
        width: getAppWidth() / 4,
        height: getAppHeight() / 4,
        blur: 8,
      });
    },

    getThumb(object) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: object.thumb,
        width: 75,
        height: 75,
      });
    },

    async fetchRandomBackgroundCriticalSection(signal) {
      await this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({
        machineIdentifier: this.machineIdentifier,
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
