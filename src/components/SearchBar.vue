<template>
  <v-autocomplete
    dense
    :items="items"
    :loading="loading"
    :search-input.sync="query"
    prepend-icon="search"
    no-filter
    clearable
    hide-details
    hide-no-data
    solo
    :menu-props="{ maxHeight: '80vh', maxWidth: '500px' }"
  >
    <template
      v-if="query"
      #prepend-item
    >
      <v-list-item
        dense
        :to="linkWithRoom({ name: 'PlexSearch', params: { query } })"
      >
        <v-subheader>
          Search all sources...
        </v-subheader>
      </v-list-item>
    </template>

    <template #item="{ item, on, attrs }">
      <template v-if="item.serverHeader">
        <v-list-item
          class="secondary"
          dense
          v-bind="attrs"
          v-on="on"
        >
          <v-subheader
            class="search-header"
          >
            {{ item.serverHeader }}
          </v-subheader>
        </v-list-item>
      </template>

      <template v-else-if="item.hubHeader">
        <v-list-item
          dense
          v-bind="attrs"
          class="search-header"
          v-on="on"
        >
          <v-subheader
            class="text-overline search-header"
          >
            {{ item.hubHeader }}
          </v-subheader>
        </v-list-item>
      </template>

      <template v-else>
        <v-list-item
          dense
          v-bind="attrs"
          :to="contentLink(item)"
          @click="clear"
        >
          <v-list-item-avatar
            height="42"
            tile
          >
            <v-img
              contain
              :src="getImgUrl(item)"
            />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title> {{ getTitle(item) }} </v-list-item-title>
            <v-list-item-subtitle> {{ getItemSecondaryTitle(item) }} </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
    </template>
  </v-autocomplete>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { CAF } from 'caf';
import contentTitle from '@/mixins/contentTitle';
import linkwithroom from '@/mixins/linkwithroom';
import contentLink from '@/mixins/contentlink';

const debounceTime = 250;

export default {
  name: 'SearchBar',

  mixins: [
    contentTitle,
    contentLink,
    linkwithroom,
  ],

  props: {
    machineIdentifier: {
      type: String,
      default: '',
    },

    sectionId: {
      type: [String, Number],
      default: '',
    },
  },

  data: () => ({
    loading: false,
    items: [],
    query: null,
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_CONNECTABLE_PLEX_SERVER_IDS',
      'GET_PLEX_SERVER',
      'GET_MEDIA_IMAGE_URL',
    ]),

    servers() {
      return this.machineIdentifier
        ? [this.machineIdentifier]
        : this.GET_CONNECTABLE_PLEX_SERVER_IDS;
    },

    searchParams() {
      return this.sectionId
        ? {
          sectionId: this.sectionId,
          contextual: 1,
        }
        : null;
    },
  },

  watch: {
    query() {
      return this.searchServers();
    },
  },

  beforeDestroy() {
    this.abortRequests();
  },

  methods: {
    ...mapActions('plexservers', [
      'SEARCH_PLEX_SERVER_HUB',
    ]),

    getItemSecondaryTitle(item) {
      return item.reason
        ? this.getReasonTitle(item)
        : this.getSecondaryTitle(item);
    },

    getItemThumb({ type, thumb, grandparentThumb }) {
      switch (type) {
        case 'movie':
          return thumb;

        case 'episode':
          return grandparentThumb;

        case 'series':
          return thumb;

        default:
          return thumb;
      }
    },

    getImgUrl(item) {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: item.machineIdentifier,
        mediaUrl: this.getItemThumb(item),
        width: 28,
        height: 42,
      });
    },

    abortRequests() {
      if (this.abortController) {
        // Cancel outstanding request
        this.abortController.abort();
        this.abortController = null;
      }
    },

    clear() {
      this.abortRequests();
      this.query = null;
      this.items = [];
      this.loading = false;
    },

    async searchServersCriticalSection(signal) {
      await Promise.all(this.servers.map(async (machineIdentifier) => {
        const serverResults = await this.SEARCH_PLEX_SERVER_HUB({
          ...this.searchParams,
          query: this.query,
          machineIdentifier,
          signal,
        });

        if (serverResults.length) {
          const results = [{
            serverHeader: this.GET_PLEX_SERVER(machineIdentifier).name,
            disabled: true,
          }].concat(
            serverResults.flatMap(({ Metadata, title }) => [{
              hubHeader: title,
              disabled: true,
            }].concat(Metadata)),
          );

          this.items.push(...results);
        }
      }));

      this.loading = false;
    },

    async searchServersDebounced(signal) {
      await CAF.delay(signal, debounceTime);
      await this.searchServersCriticalSection(signal);
    },

    async searchServers() {
      this.abortRequests();

      this.items = [];
      if (!this.query || !this.query.trim()) {
        this.loading = false;
        return;
      }

      this.loading = true;

      const controller = new AbortController();
      this.abortController = controller;

      try {
        await this.searchServersDebounced(controller.signal);
      } catch (e) {
        if (!controller.signal.aborted) {
          throw e;
        }
      }
    },
  },
};
</script>

<style scoped>
.v-list-item.search-header,
.v-subheader.search-header {
  height: unset;
  min-height: unset;
}
</style>
