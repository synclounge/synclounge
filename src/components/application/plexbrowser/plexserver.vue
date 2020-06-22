<template>
  <v-container
    class="pt-0"
    fluid
  >
    <v-row
      v-if="!libraries && !browsingLibrary && !selectedItem"
      align="center"
    >
      <v-col
        cols="12"
        style="position: relative"
      >
        <v-progress-circular
          style="left:50%; top:50%"
          :size="60"
          indeterminate
          class="amber--text"
        />
      </v-col>
    </v-row>

    <template
      v-if="!browsingLibrary && !selectedItem && libraries"
    >
      <div v-if="!libraries && !browsingLibrary">
        <v-progress-circular
          active
          large
        />
      </div>

      <v-subheader>Libraries</v-subheader>
      <v-row
        v-if="libraries && !browsingLibrary"
        no-gutters
      >
        <v-col
          v-for="library in libraries"
          :key="library.name"
          cols="12"
          md="3"
          lg="2"
          class="pa-1"
        >
          <v-card
            :img="getArtLibrary(library)"
            flat
            class="clickable text-center"
            style="max-width:100%; cursor: pointer; border-radius: 0px !important"
            @click.native="setLibrary(library)"
          >
            <div
              style="position:relative; width:100%; background: rgba(0,0,0,0.4); height:8em"
              class="hidden-xs-only"
            >
              <img
                style="height: 70%; display: block; margin-left: auto; margin-right: auto "
                :src="getThumb(library)"
              >
            </div>
            <div
              style="background: rgba(0,0,0,0.7); position:relative; width:100%;"
              class="text-center pa-1"
            >
              <h2 class="truncate text-xs-left text-sm-center">
                {{ library.title }}
              </h2>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-divider
        v-if="subsetOnDeck.length > 0"
        class="mt-3 ma-2"
      />

      <v-row
        v-if="subsetOnDeck.length > 0"
        no-gutters
      >
        <v-col>
          <v-subheader class="compact-header">
            On Deck
          </v-subheader>
        </v-col>

        <v-col
          cols="auto"
          class="ml-auto"
        >
          <v-icon
            style="cursor: pointer"
            :style="onDeckDownStyle"
            @click="onDeckDown"
          >
            navigate_before
          </v-icon>

          <v-icon
            :style="onDeckUpStyle"
            style="cursor: pointer"
            @click="onDeckUp"
          >
            navigate_next
          </v-icon>
        </v-col>
      </v-row>

      <v-row
        v-if="onDeck"
        no-gutters
      >
        <v-col
          v-for="content in subsetOnDeck"
          :key="content.key"
          sm="6"
          md="4"
          lg="3"
          class="pb-3 pa-1"
        >
          <plexthumb
            :content="content"
            :machine-identifier="machineIdentifier"
            type="art"
            @contentSet="setContent(content)"
          />
        </v-col>
      </v-row>

      <v-divider
        v-if="subsetRecentlyAdded.length > 0"
        class="mt-3 ma-2"
      />

      <v-row
        v-if="subsetRecentlyAdded.length > 0"
        no-gutters
      >
        <v-col>
          <v-subheader class="compact-header">
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
            style="cursor: pointer"
            @click="recentlyAddedUp"
          >
            navigate_next
          </v-icon>
        </v-col>
      </v-row>

      <v-row
        v-if="recentlyAdded"
        justify="space-between"
        no-gutters
      >
        <v-col
          v-for="content in subsetRecentlyAdded"
          :key="content.key"
          cols="4"
          sm="2"
          md="1"
          class="pb-3 pa-3"
        >
          <plexthumb
            :content="content"
            :machine-identifier="machineIdentifier"
            type="thumb"
            full-title
            locked
            @contentSet="setContent(content)"
          />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { sample } from 'lodash-es';
import { mapActions, mapGetters, mapMutations } from 'vuex';

import sizing from '@/mixins/sizing';

export default {
  components: {
    plexthumb: () => import('./plexthumb.vue'),
  },

  mixins: [
    sizing,
  ],

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      browsingLibrary: null,
      selectedItem: null,

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
        case 'sm': return 6;
        case 'md': return 12;
        case 'lg': return 12;
        case 'xl': return 12;
        default: return 12;
      }
    },

    onDeckItemsPer() {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs': return 1;
        case 'sm': return 2;
        case 'md': return 3;
        case 'lg': return 4;
        case 'xl': return 4;
        default: return 4;
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
        ? this.GET_PLEX_SERVER(this.machineIdentifier).libraries
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
      'FETCH_ALL_LIBRARIES_IF_NEEDED',
      'FETCH_ON_DECK',
    ]),

    ...mapMutations([
      'SET_BACKGROUND',
      'SET_ACTIVE_METADATA',
    ]),

    fetchData() {
      return Promise.all([
        this.FETCH_ALL_LIBRARIES_IF_NEEDED(this.machineIdentifier),
        this.fetchRecentlyAdded(),
        this.fetchOnDeck(),
      ]);
    },

    async fetchRecentlyAdded() {
      this.recentlyAdded = await this.FETCH_RECENTLY_ADDED_MEDIA(this.machineIdentifier);
      if (this.recentlyAdded) {
        this.setBackground();
      }
    },

    async fetchOnDeck() {
      this.onDeck = await this.FETCH_ON_DECK({
        machineIdentifier: this.machineIdentifier,
        start: 0,
        size: 10,
      });
    },

    setContent(content) {
      this.selectedItem = content;
    },

    setLibrary(library) {
      this.$router.push(`/browse/${this.machineIdentifier}/${library.key}`);
      // this.browsingLibrary = library
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

    setBackground() {
      this.$store.commit('SET_BACKGROUND',
        this.GET_MEDIA_IMAGE_URL({
          machineIdentifier: this.machineIdentifier,
          mediaUrl: sample(this.recentlyAdded).art,
          width: this.getAppWidth() / 4,
          height: this.getAppHeight() / 1,
          blur: 6,
        }));
    },

    getArtLibrary(object) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: object.art,
        width: this.getAppWidth(),
        height: this.getAppHeight(),
        blur: 15,
      });
    },

    getThumb(object) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.machineIdentifier,
        mediaUrl: object.thumb,
        width: this.getAppWidth() / 4,
        height: this.getAppHeight() / 4,
      });
    },
  },
};
</script>

<style scoped>
div.compact-header {
  height: auto;
}
</style>
