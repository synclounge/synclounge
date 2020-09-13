<template>
  <v-autocomplete
    :items="items"
    :loading="loading"
    :search-input.sync="search"
    prepend-icon="search"
    no-filter
    clearable
    hide-details
    hide-no-data
    solo
    :menu-props="{ maxHeight: '80vh' }"
  >
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
          :to="getLink(item)"
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
            <v-list-item-subtitle> {{ getSecondaryTitle(item) }} </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
    </template>
  </v-autocomplete>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { debounce } from '@/utils/lightlodash';
import contentTitle from '@/mixins/contentTitle';
import getContentLink from '@/utils/contentlinks';

export default {
  name: 'SearchBar',

  mixins: [
    contentTitle,
  ],

  data: () => ({
    loading: false,
    items: [],
    search: null,
    storedWord: null,
  }),

  computed: {
    ...mapGetters('plexservers', [
      'GET_CONNECTABLE_PLEX_SERVER_IDS',
      'GET_PLEX_SERVER',
      'GET_MEDIA_IMAGE_URL',
    ]),
  },

  watch: {
    search() {
      this.searchAllServers();
    },
  },

  methods: {
    ...mapActions('plexservers', [
      'SEARCH_PLEX_SERVER_HUB',
    ]),

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

    searchAllServers: debounce(async function search() {
      if (this.search === '') {
        this.items = [];
        return;
      }

      this.loading = true;
      this.items = [];
      const storedWord = this.search;

      await Promise.all(this.GET_CONNECTABLE_PLEX_SERVER_IDS.map(async (machineIdentifier) => {
        const serverResults = await this.SEARCH_PLEX_SERVER_HUB({
          query: this.search,
          machineIdentifier,
        });

        if (storedWord !== this.search) {
          // Old data
          return;
        }
        console.log(serverResults);
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
    }, 500),

    getLink(params) {
      return getContentLink(params);
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
