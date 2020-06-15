<template>
  <v-container>
    <v-row
      v-if="!selectedItem && !browsingServer"
      class="mb-3"
    >
      <v-col
        sm="12"
        lg="4"
      >
        <v-text-field
          id="testing"
          v-model="searchWord"
          name="searchInput"
          label="Search"
          :hint="searchStatus"
          persistent-hint
          single-line
          prepend-icon="search"
        />
      </v-col>

      <v-col>
        <v-icon
          v-if="searchResults.length > 0"
          class="clickable red--text pt-3"
          @click="searchResults = []; searchWord = ''; searching = false"
        >
          clear
        </v-icon>
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
          :key="movie.key"
          sm="6"
          md="3"
          lg="1"
          class="pb-3 ma-2"
        >
          <plexthumb
            :content="movie"
            :server-id="movie.machineIdentifier"
            show-server
            search
            @contentSet="setContent(movie)"
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
          :key="show.key"
          sm="6"
          md="3"
          lg="1"
          class="pb-3 ma-2"
        >
          <plexthumb
            :content="show"
            :server-id="show.machineIdentifier"
            show-server
            search
            @contentSet="setContent(show)"
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
          :key="episode.key"
          sm="6"
          md="3"
          lg="2"
          class="pb-3 ma-2"
        >
          <plexthumb
            :content="episode"
            :server-id="episode.machineIdentifier"
            show-server
            type="art"
            search
            @contentSet="setContent(episode)"
          />
        </v-col>
      </v-row>
    </template>


    <v-divider />

    <template
      v-if="GET_LAST_SERVER && searchResults.length == 0"
    >
      <v-subheader v-if="subsetOnDeck.length > 0">
        Continue watching from {{ GET_LAST_SERVER.name }}
        <span
          style="float:right; font-size:5rem; user-select: none;"
        >
          <v-icon
            style="cursor: pointer"
            :style="onDeckDownStyle"
            @click="onDeckDown"
          >navigate_before</v-icon>

          <v-icon
            :style="onDeckUpStyle"
            style="cursor: pointer"
            @click="onDeckUp"
          >navigate_next</v-icon>
        </span>
      </v-subheader>


      <v-row
        v-if="onDeck"
        justify="center"
      >
        <v-col
          v-for="content in subsetOnDeck"
          :key="content.key"
          cols="3"
          class="pb-3 pa-2"
        >
          <plexthumb
            :content="content"
            :server-id="GET_LAST_SERVER_ID"
            type="art"
            @contentSet="setContent(content)"
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
        <v-icon
          class="pl-2"
          small
          @click="FETCH_PLEX_DEVICES"
        >
          refresh
        </v-icon>
      </v-subheader>


      <v-row>
        <v-col
          v-if="GET_PLEX_SERVERS.length === 0"
          cols="12"
        >
          <h5>
            No Plex Servers found.
            Make sure your server owner has shared libraries with you!
          </h5>
        </v-col>

        <v-col
          v-for="server in GET_PLEX_SERVERS"
          :key="server.clientIdentifier"
          sm="12"
          md="6"
          lg="4"
          xl="3"
          class="pa-2"
        >
          <router-link :to="'/browse/' + server.clientIdentifier">
            <v-card
              class="white--text"
              horizontal
              height="10em"
              style="cursor: pointer; z-index: 0; background: rgba(0,0,0,0.4);"
              :title="server.name"
            >
              <v-container fill-height>
                <v-row
                  justify="center"
                  align="center"
                >
                  <v-col cols="4">
                    <v-img
                      :src="getLogos.plex.standard"
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

                      <h4 style="opacity: 0.9">
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
                        style="font-size: 10px"
                      >
                        Try disabling your adblocker
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </v-card>
          </router-link>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { debounce } from 'lodash-es';


export default {
  name: 'Plexbrowser',
  components: {
    plexthumb: () => import('./plexbrowser/plexthumb.vue'),
  },

  data() {
    return {
      browsingServer: null,
      selectedItem: null,
      browsingContent: null,

      searchResults: [],
      onDeckOffset: 0,
      onDeck: null,
      searchWord: '',
      searchStatus: 'Search your available Plex Media Servers',
      searching: false,
      serverIdsHeardBack: [],
    };
  },

  computed: {
    ...mapGetters([
      'getLogos',
    ]),
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
          return 2;
        case 'md':
          return 4;
        case 'lg':
          return 4;
        case 'xl':
          return 4;
        default:
          return 4;
      }
    },

    onDeckUpStyle() {
      if (this.onDeckOffset + 3 >= this.onDeck.MediaContainer.Metadata.length) {
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
      return this.searchResults.filter((item) => {
        if (!item) {
          return false;
        }
        if (item.type === 'show') {
          return true;
        }
        return false;
      });
    },

    filteredEpisodes() {
      return this.searchResults.filter((item) => {
        if (!item) {
          return false;
        }
        if (item.type === 'episode') {
          return true;
        }
        return false;
      });
    },

    filteredMovies() {
      return this.searchResults.filter((item) => {
        if (!item) {
          return false;
        }
        if (item.type === 'movie') {
          return true;
        }
        return false;
      });
    },

    filteredSeasons() {
      return this.searchResults.filter((item) => {
        if (!item) {
          return false;
        }
        if (item.type === 'series') {
          return true;
        }
        return false;
      });
    },

    subsetOnDeck() {
      if (
        !this.onDeck
        || !this.onDeck.MediaContainer
        || !this.onDeck.MediaContainer.Metadata
      ) {
        return [];
      }
      return this.onDeck.MediaContainer.Metadata.slice(
        this.onDeckOffset,
        this.onDeckOffset + this.onDeckItemsPer,
      );
    },
  },

  watch: {
    searchWord() {
      if (this.searchWord === '') {
        this.searchResults = [];
        this.searchStatus = 'Search your available Plex Media Servers';
        return;
      }
      this.searchAllServers();
    },
  },

  async mounted() {
    if (this.GET_LAST_SERVER_ID) {
      this.onDeck = await this.FETCH_ON_DECK({
        machineIdentifier: this.GET_LAST_SERVER_ID,
        start: 0,
        stop: 10,
      });
    }
  },

  methods: {
    ...mapActions(['FETCH_PLEX_DEVICES']),
    ...mapActions('plexservers', [
      'SEARCH_PLEX_SERVER',
    ]),

    onDeckDown() {
      if (
        !this.onDeck
        || !this.onDeck.MediaContainer
        || !this.onDeck.MediaContainer.Metadata
      ) {
        return;
      }

      if (this.onDeckOffset - 4 < 0) {
        this.onDeckOffset = 0;
      } else {
        this.onDeckOffset -= 4;
      }
    },

    onDeckUp() {
      if (
        !this.onDeck
        || !this.onDeck.MediaContainer
        || !this.onDeck.MediaContainer.Metadata
      ) {
        return;
      }

      if (this.onDeckOffset + 4 >= this.onDeck.MediaContainer.Metadata.length) {
        // This would overflow!
      } else {
        this.onDeckOffset += 4;
      }
    },

    setContent(content) {
      this.selectedItem = content;
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
