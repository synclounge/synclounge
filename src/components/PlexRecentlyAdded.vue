<template>
  <div v-if="recentlyAdded.length">
    <slot name="preHeader" />

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
        <v-btn
          icon
          :style="recentlyAddedDownStyle"
          @click="recentlyAddedDown"
        >
          <v-icon>navigate_before</v-icon>
        </v-btn>

        <v-btn
          icon
          :style="recentlyAddedUpStyle"
          @click="recentlyAddedUp"
        >
          <v-icon>navigate_next</v-icon>
        </v-btn>
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
        <PlexThumbnail
          :content="content"
          full-title
          type="thumb"
          cols="4"
          sm="3"
          md="2"
          xl="1"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'PlexOnDeck',

  components: {
    PlexThumbnail: () => import('@/components/PlexThumbnail.vue'),
  },

  props: {
    machineIdentifier: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    recentlyAdded: [],
    recentlyAddedOffset: 0,
    abortController: null,
  }),

  computed: {
    recentItemsPer() {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs': return 3;
        case 'sm': return 4;
        case 'md':
        case 'lg': return 6;
        default: return 12;
      }
    },

    recentlyAddedDownStyle() {
      return this.recentlyAddedOffset === 0
        ? {
          opacity: 0.5,
        }
        : {};
    },

    recentlyAddedUpStyle() {
      return this.recentlyAddedOffset + this.recentItemsPer
        >= this.recentlyAdded.length
        ? {
          opacity: 0.5,
        }
        : {};
    },

    subsetRecentlyAdded() {
      return this.recentlyAdded.slice(
        this.recentlyAddedOffset,
        this.recentlyAddedOffset + this.recentItemsPer,
      );
    },
  },

  watch: {
    machineIdentifier: {
      handler() {
        this.recentlyAdded = [];
        this.recentlyAddedOffset = 0;
        return this.fetchRecentlyAdded();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_RECENTLY_ADDED_MEDIA',
    ]),

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    recentlyAddedUp() {
      if (this.recentlyAddedOffset + this.recentItemsPer
        >= this.recentlyAdded.length) {
        // This would overflow!
      } else {
        this.recentlyAddedOffset += this.recentItemsPer;
      }
    },

    recentlyAddedDown() {
      if (this.recentlyAddedOffset - this.recentItemsPer < 0) {
        this.recentlyAddedOffset = 0;
      } else {
        this.recentlyAddedOffset -= this.recentItemsPer;
      }
    },

    async fetchRecentlyAddedCriticalSection(signal) {
      this.recentlyAdded = await this.FETCH_RECENTLY_ADDED_MEDIA({
        machineIdentifier: this.machineIdentifier,
        signal,
      });
    },

    async fetchRecentlyAdded() {
      this.abortRequests();

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.fetchRecentlyAddedCriticalSection(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>
