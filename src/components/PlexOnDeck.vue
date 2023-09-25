<template>
  <div v-if="onDeck.length">
    <slot name="preHeader" />

    <v-row
      no-gutters
    >
      <v-col>
        <v-subheader>
          <slot name="header">
            On Deck
          </slot>
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

    <v-row>
      <v-col
        v-for="content in subsetOnDeck"
        :key="content.key"
        cols="12"
        sm="4"
        md="3"
        xl="2"
      >
        <PlexThumbnail
          :content="content"
          type="art"
          cols="12"
          sm="4"
          md="3"
          xl="2"
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
    onDeck: [],
    onDeckOffset: 0,
    abortController: null,
  }),

  computed: {
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
      return this.onDeckOffset + this.onDeckItemsPer >= this.onDeck.length
        ? {
          opacity: 0.5,
        }
        : {};
    },

    onDeckDownStyle() {
      return this.onDeckOffest === 0
        ? {
          opacity: 0.5,
        }
        : {};
    },

    subsetOnDeck() {
      return this.onDeck.slice(
        this.onDeckOffset,
        this.onDeckOffset + this.onDeckItemsPer,
      );
    },
  },

  watch: {
    machineIdentifier: {
      handler() {
        this.onDeck = [];
        this.onDeckOffset = 0;
        return this.fetchOnDeck();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_ON_DECK',
    ]),

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    onDeckDown() {
      if (this.onDeckOffset - this.onDeckItemsPer < 0) {
        this.onDeckOffset = 0;
      } else {
        this.onDeckOffset -= 4;
      }
    },

    onDeckUp() {
      if (this.onDeckOffset + this.onDeckItemsPer >= this.onDeck.length) {
        // This would overflow!
      } else {
        this.onDeckOffset += this.onDeckItemsPer;
      }
    },

    async fetchOnDeckCriticalSection(signal) {
      this.onDeck = await this.FETCH_ON_DECK({
        machineIdentifier: this.machineIdentifier,
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
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>
