<template>
  <PlexMediaLayout
    :machine-identifier="metadata.machineIdentifier"
    :art="metadata.banner || metadata.art"
    :thumb="metadata.thumb"
    :title="metadata.parentTitle"
    :secondary-title="metadata.title"
    :subtitle="subtitle"
    children-header="Episodes"
    :children="children"
    child-full-title
    child-cols="6"
    child-sm="4"
    child-md="3"
    child-xl="2"
  >
    <template #content>
      <v-row
        v-if="metadata.summary"
        class="text--primary text-body-2"
      >
        <v-col>
          {{ metadata.summary }}
        </v-col>
      </v-row>
    </template>
  </PlexMediaLayout>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'PlexSeason',

  components: {
    PlexMediaLayout: () => import('@/components/PlexMediaLayout.vue'),
  },

  props: {
    metadata: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    children: [],
    abortController: null,
  }),

  computed: {
    // This exists so we can watch if either of these change
    combinedKey() {
      return {
        machineIdentifier: this.metadata.machineIdentifier,
        ratingKey: this.metadata.ratingKey,
      };
    },

    subtitle() {
      const episodeWord = this.metadata.leafCount === 1
        ? 'episode'
        : 'episodes';

      return `${this.metadata.leafCount} ${episodeWord}`;
    },
  },

  watch: {
    combinedKey: {
      handler() {
        return this.fetchChildren();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'FETCH_MEDIA_CHILDREN',
    ]),

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    async fetchChildrenCriticalSection(signal) {
      this.children = await this.FETCH_MEDIA_CHILDREN({
        machineIdentifier: this.metadata.machineIdentifier,
        ratingKey: this.metadata.ratingKey,
        start: 0,
        size: 500,
        excludeAllLeaves: 1,
        signal,
      });
    },

    async fetchChildren() {
      this.abortRequests();

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.fetchChildrenCriticalSection(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>
