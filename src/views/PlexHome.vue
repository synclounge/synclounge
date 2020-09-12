<template>
  <v-container fluid>
    <v-row
      class="mb-3"
    >
      <v-col
        cols="10"
        lg="4"
      >
        <v-text-field
          v-model="searchWord"
          name="searchInput"
          label="Search"
          :hint="searchStatus"
          persistent-hint
          single-line
          prepend-icon="search"
          clearable
        />
      </v-col>
    </v-row>

    <v-row
      v-if="searching || searchResults.length > 0"
    >
      <v-chip
        v-for="server in GET_PLEX_SERVERS"
        :key="server.machineIdentifier"
        outlined
        class="green darken-3 white--text"
      >
        <v-avatar>
          <v-icon v-if="!heardBack(server.machineIdentifier)">
            clear
          </v-icon>
          <v-icon v-if="heardBack(server.machineIdentifier)">
            check_circle
          </v-icon>
        </v-avatar>
        {{ server.name }}
      </v-chip>
    </v-row>

    <v-progress-circular
      v-if="searching"
      indeterminate
      class="amber--text"
    />

    <template v-if="searchResults.length > 0">
      <v-row
        v-if="filteredMovies && filteredMovies.length > 0"
      >
        <!--Movies-->
        <v-col
          cols="12"
        >
          <v-subheader>Movies ({{ filteredMovies.length }})</v-subheader>
        </v-col>

        <v-col
          v-for="movie in filteredMovies"
          :key="movie.ratingKey"
          cols="4"
          sm="3"
          md="2"
          xl="1"
        >
          <PlexThumbnail
            :content="movie"
            :machine-identifier="movie.machineIdentifier"
            show-server
            cols="4"
            sm="3"
            md="2"
            xl="1"
          />
        </v-col>
      </v-row>

      <v-row
        v-if="filteredShows && filteredShows.length > 0"
      >
        <!--Shows-->
        <v-col
          cols="12"
        >
          <v-subheader>TV Shows ({{ filteredShows.length }})</v-subheader>
        </v-col>

        <v-col
          v-for="show in filteredShows"
          :key="show.ratingKey"
          cols="4"
          sm="3"
          md="2"
          xl="1"
        >
          <PlexThumbnail
            :content="show"
            :machine-identifier="show.machineIdentifier"
            show-server
            cols="4"
            sm="3"
            md="2"
            xl="1"
          />
        </v-col>
      </v-row>

      <v-row
        v-if="filteredEpisodes && filteredEpisodes.length > 0"
      >
        <!--Episodes-->
        <v-col
          cols="12"
        >
          <v-subheader>TV Episodes ({{ filteredEpisodes.length }})</v-subheader>
        </v-col>

        <v-col
          v-for="episode in filteredEpisodes"
          :key="episode.ratingKey"
          cols="6"
          sm="4"
          md="3"
          xl="2"
        >
          <PlexThumbnail
            :content="episode"
            :machine-identifier="episode.machineIdentifier"
            show-server
            type="art"
            cols="6"
            sm="4"
            md="3"
            xl="2"
          />
        </v-col>
      </v-row>
    </template>

    <v-divider />

    <template
      v-if="GET_LAST_SERVER && searchResults.length == 0 && subsetOnDeck.length > 0"
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

    <template
      v-if="searchResults.length == 0"
      class="pt-4"
    >
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
          v-if="GET_PLEX_SERVERS.length === 0"
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
            class="white--text"
            horizontal
            height="10em"
            style="z-index: 0; background: rgba(0, 0, 0, 0.4);"
            :title="server.name"
          >
            <v-container fill-height>
              <v-row
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
                    <h1 style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">
                      {{ server.name }}
                    </h1>

                    <h4 style="opacity: 0.9;">
                      v{{ server.productVersion }}
                    </h4>

                    <div>Owned by {{ ownerOfServer(server) }}</div>

                    <div
                      v-if="!server.chosenConnection"
                      class="red--text"
                    >
                      Unable to connect
                    </div>

                    <div
                      v-if="!server.chosenConnection"
                      class="red--text"
                      style="font-size: 10px;"
                    >
                      Try disabling your adblocker
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { debounce } from '@/utils/lightlodash';

export default {
  name: 'PlexHome',
  components: {
    PlexThumbnail: () => import('@/components/PlexThumbnail.vue'),
  },

  data() {
    return {
      searchResults: [],
      onDeckOffset: 0,
      onDeck: null,
      searchWord: '',
      searchStatus: 'Search your available Plex Media Servers',
      searching: false,
      serverIdsHeardBack: [],
      abortController: new AbortController(),
    };
  },

  computed: {
    ...mapGetters('plexservers', [
      'GET_LAST_SERVER',
      'GET_LAST_SERVER_ID',
      'GET_PLEX_SERVERS',
      'GET_CONNECTABLE_PLEX_SERVER_IDS',
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

    filteredShows() {
      return this.searchResults.filter((item) => item.type === 'show');
    },

    filteredEpisodes() {
      return this.searchResults.filter((item) => item.type === 'episode');
    },

    filteredMovies() {
      return this.searchResults.filter((item) => item.type === 'movie');
    },

    filteredSeasons() {
      return this.searchResults.filter((item) => item.type === 'series');
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
    searchWord() {
      if (this.searchWord == null || this.searchWord === '') {
        this.searchResults = [];
        this.searchStatus = 'Search your available Plex Media Servers';
        return;
      }
      this.searchAllServers();
    },

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
    this.FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE({ signal: this.abortController.signal });
  },

  beforeDestroy() {
    this.abortController.abort();
  },

  methods: {
    ...mapActions('plexservers', [
      'SEARCH_PLEX_SERVER',
      'FETCH_ON_DECK',
      'FETCH_AND_SET_RANDOM_BACKGROUND_IMAGE',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES',
    ]),

    ...mapMutations([
      'SET_ACTIVE_METADATA',
    ]),

    async fetchOnDeck() {
      this.onDeck = await this.FETCH_ON_DECK({
        machineIdentifier: this.GET_LAST_SERVER_ID,
        start: 0,
        size: 10,
        signal: this.abortController.signal,
      });
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

    ownerOfServer(server) {
      return server.owned
        ? 'you'
        : server.sourceTitle;
    },

    heardBack(id) {
      return this.serverIdsHeardBack.includes(id);
    },

    searchAllServers: debounce(async function search() {
      if (this.searchWord === '') {
        this.searchResults = [];
        this.searchStatus = 'Search your available Plex Media Servers';
        return;
      }

      this.searching = true;
      this.searchResults = [];
      this.serversResponded = 0;
      const storedWord = this.searchWord;

      await Promise.all(this.GET_CONNECTABLE_PLEX_SERVER_IDS.map(async (machineIdentifier) => {
        const serverResults = await this.SEARCH_PLEX_SERVER({
          query: this.searchWord,
          machineIdentifier,
        });

        if (storedWord !== this.searchWord) {
          // Old data
          return;
        }
        this.serversResponded += 1;
        this.serverIdsHeardBack.push(machineIdentifier);

        if (serverResults) {
          this.searchResults.push(...serverResults);
        }

        this.searchStatus = `Found ${this.searchResults.length} results from ${
          this.serversResponded
        } servers`;
      }));

      this.searching = false;
    }, 1000),
  },
};
</script>
