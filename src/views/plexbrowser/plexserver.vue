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
          <template v-slot:activator="{ on, attrs }">
            <v-card
              :img="getArtLibrary(library)"
              v-bind="attrs"
              flat
              :to="{ name: 'library', params: {
                machineIdentifier: machineIdentifier,
                sectionId: library.key,
              }}"
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
                style="background: rgba(0, 0, 0, 0.7);"
                class="px-3 py-1"
              >
                {{ library.title }}
              </v-card-title>
            </v-card>
          </template>

          <span>{{ library.title }}</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <template v-if="subsetOnDeck.length > 0">
      <v-divider
        class="mt-3 ma-2"
      />

      <v-row
        no-gutters
      >
        <v-col>
          <v-subheader>
            On Deck
          </v-subheader>
        </v-col>

        <v-col
          cols="auto"
          class="ml-auto"
        >
          <v-icon
            style="cursor: pointer;"
            :style="onDeckDownStyle"
            @click="onDeckDown"
          >
            navigate_before
          </v-icon>

          <v-icon
            :style="onDeckUpStyle"
            style="cursor: pointer;"
            @click="onDeckUp"
          >
            navigate_next
          </v-icon>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="content in subsetOnDeck"
          :key="content.key"
          cols="12"
          sm="4"
          md="3"
          xl="2"
        >
          <plexthumb
            :content="content"
            :machine-identifier="machineIdentifier"
            type="art"
            cols="12"
            sm="4"
            md="3"
            xl="2"
          />
        </v-col>
      </v-row>
    </template>

    <template
      v-if="subsetRecentlyAdded.length > 0"
    >
      <v-divider
        class="mt-3 ma-2"
      />

      <v-row
        no-gutters
      >
        <v-col>
          <v-subheader>
            Recently Added
          </v-subheader>
        </v-col>

        <v-col
          cols="auto"
          class="ml-auto"
        >
          <v-icon
            style="cursor: pointer;"
            :style="recentlyAddedDownStyle"
            @click="recentlyAddedDown"
          >
            navigate_before
          </v-icon>

          <v-icon
            :style="recentlyAddedUpStyle"
            style="cursor: pointer;"
            @click="recentlyAddedUp"
          >
            navigate_next
          </v-icon>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="content in subsetRecentlyAdded"
          :key="content.key"
          cols="4"
          sm="3"
          md="2"
          xl="1"
        >
          <plexthumb
            :content="content"
            :machine-identifier="machineIdentifier"
            full-title
            type="thumb"
            cols="4"
            sm="3"
            md="2"
            xl="1"
          />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { getAppWidth, getAppHeight } from '@/utils/sizing';

export default {
  components: {
    plexthumb: () => import('@/components/plex/plexthumb.vue'),
  },

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      recentlyAdded: null,
      onDeck: null,
      onDeckOffset: 0,
      recentlyAddedOffset: 0,
    };
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_MEDIA_IMAGE_URL',
      'GET_PLEX_SERVER',
    ]),

    recentItemsPer() {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs': return 3;
        case 'sm': return 4;
        case 'md':
        case 'lg': return 6;
        default: return 12;
      }
    },

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
      if ((this.onDeckOffset + this.onDeckItemsPer) >= this.onDeck.length) {
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

    recentlyAddedDownStyle() {
      if (this.recentlyAddedOffset === 0) {
        return {
          opacity: 0.5,
        };
      }

      return {};
    },

    recentlyAddedUpStyle() {
      if (this.recentlyAddedOffset + this.recentItemsPer
        >= this.recentlyAdded.length) {
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
      return this.onDeck.slice(this.onDeckOffset,
        this.onDeckOffset + this.onDeckItemsPer);
    },

    subsetRecentlyAdded() {
      if (!this.recentlyAdded) {
        return [];
      }

      return this.recentlyAdded.slice(this.recentlyAddedOffset,
        this.recentlyAddedOffset + this.recentItemsPer);
    },

    libraries() {
      return this.GET_PLEX_SERVER(this.machineIdentifier).libraries
        ? Object.values(this.GET_PLEX_SERVER(this.machineIdentifier).libraries)
          .filter((library) => library.type !== 'artist'
            || library.agent !== 'tv.plex.agents.music')
        : [];
    },
  },

  created() {
    this.SET_ACTIVE_METADATA({
      machineIdentifier: this.machineIdentifier,
    });

    this.fetchData();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_RECENTLY_ADDED_MEDIA',
      'FETCH_ON_DECK',
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    fetchData() {
      // TODO: handle abort stuff
      return Promise.all([
        this.fetchRecentlyAdded(),
        this.fetchOnDeck(),
        this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({ machineIdentifier: this.machineIdentifier }),
      ]);
    },

    async fetchOnDeck() {
      this.onDeck = await this.FETCH_ON_DECK({
        machineIdentifier: this.machineIdentifier,
        start: 0,
        size: 10,
      });
    },

    async fetchRecentlyAdded() {
      this.recentlyAdded = await this.FETCH_RECENTLY_ADDED_MEDIA({
        machineIdentifier: this.machineIdentifier,
      });
    },

    onDeckDown() {
      if (!this.onDeck) {
        return;
      }

      if (this.onDeckOffset - this.onDeckItemsPer < 0) {
        this.onDeckOffset = 0;
      } else {
        this.onDeckOffset -= 4;
      }
    },

    onDeckUp() {
      if (!this.onDeck) {
        return;
      }

      if (this.onDeckOffset + this.onDeckItemsPer >= this.onDeck.length) {
        // This would overflow!
      } else {
        this.onDeckOffset += this.onDeckItemsPer;
      }
    },

    recentlyAddedUp() {
      if (!this.recentlyAdded) {
        return;
      }

      if (this.recentlyAddedOffset + this.recentItemsPer
        >= this.recentlyAdded.length) {
        // This would overflow!
      } else {
        this.recentlyAddedOffset += this.recentItemsPer;
      }
    },

    recentlyAddedDown() {
      if (!this.recentlyAdded) {
        return;
      }

      if (this.recentlyAddedOffset - this.recentItemsPer < 0) {
        this.recentlyAddedOffset = 0;
      } else {
        this.recentlyAddedOffset -= this.recentItemsPer;
      }
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
  },
};
</script>
