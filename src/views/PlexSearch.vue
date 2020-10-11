<template>
  <v-container
    fluid
  >
    <v-progress-linear
      :active="loading"
      :indeterminate="true"
    />

    <div
      v-for="(hub, id) in hubs"
      :key="id"
      dense
    >
      <v-subheader>{{ hub.title }}</v-subheader>

      <v-row>
        <v-col
          v-for="item in hub.Metadata"
          :key="item.ratingKey + item.machineIdentifier"
          :cols="getHubCols(hub)"
          :sm="getHubSm(hub)"
          :md="getHubMd(hub)"
          :xl="getHubXl(hub)"
        >
          <PlexThumbnail
            :content="item"
            show-server
            type="thumb"
            :cols="getHubCols(hub)"
            :sm="getHubSm(hub)"
            :md="getHubMd(hub)"
            :xl="getHubXl(hub)"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import Vue from 'vue';
import { mapActions, mapGetters, mapMutations } from 'vuex';

export default {
  name: 'PlexSearch',

  components: {
    PlexThumbnail: () => import('@/components/PlexThumbnail.vue'),
  },

  props: {
    query: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    loading: false,
    hubs: {},
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_CONNECTABLE_PLEX_SERVER_IDS',
      'GET_PLEX_SERVER',
      'GET_MEDIA_IMAGE_URL',
    ]),
  },

  watch: {
    query: {
      handler() {
        this.updateCrumbs();
        return this.searchServers();
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'SEARCH_PLEX_SERVER_HUB',
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

    updateCrumbs() {
      this.SET_ACTIVE_METADATA({
        query: this.query,
      });
    },

    addHubs(newHubs) {
      newHubs.forEach((hub) => {
        if (!this.hubs[hub.hubIdentifier]) {
          Vue.set(this.hubs, hub.hubIdentifier, hub);
        } else {
          this.hubs[hub.hubIdentifier].Metadata.push(...hub.Metadata);
        }
      });
    },

    async searchServersCriticalSection(signal) {
      await Promise.all(this.GET_CONNECTABLE_PLEX_SERVER_IDS.map(async (machineIdentifier) => {
        const serverResults = await this.SEARCH_PLEX_SERVER_HUB({
          query: this.query,
          machineIdentifier,
          limit: 30,
          signal,
        });

        this.addHubs(serverResults);
      }));

      this.loading = false;
    },

    async searchServers() {
      this.abortRequests();

      this.hubs = {};
      this.loading = true;

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.searchServersCriticalSection(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },

    getHubCols({ type }) {
      return type === 'episode'
        ? 6
        : 4;
    },

    getHubSm({ type }) {
      return type === 'episode'
        ? 4
        : 3;
    },

    getHubMd({ type }) {
      return type === 'episode'
        ? 3
        : 2;
    },

    getHubXl({ type }) {
      return type === 'episode'
        ? 2
        : 1;
    },
  },
};
</script>
