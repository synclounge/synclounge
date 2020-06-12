<template>
  <div>
    <div>
      <v-container fluid>
        <v-row
          v-if="!selectedItem && !browsingServer"
          class="mb-3"
        >
          <v-col>
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
              v-if="results.length > 0"
              class="clickable red--text pt-3"
              @click="results = []; searchWord = ''; searching = false"
            >
              clear
            </v-icon>
          </v-col>
        </v-row>
      </v-container>

      <v-row
        v-if="searching || results.length > 0"
      >
        <v-chip
          v-for="server in getPlex.servers"
          :key="server.machineIdentifier"
          outlined
          class="green darken-3 white--text"
        >
          <v-avatar>
            <v-icon v-if="!heardBack(server)">
              clear
            </v-icon>
            <v-icon v-if="heardBack(server)">
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

      <div v-if="results.length > 0">
        <v-row
          v-if="filteredMovies && filteredMovies.length > 0"
          row
          wrap
        >
          <!--Movies-->
          <v-col
            xs12
            lg12
          >
            <v-subheader>Movies ({{ filteredMovies.length }})</v-subheader>
          </v-col>
          <v-col
            v-for="movie in filteredMovies"
            :key="movie.key"
            xs6
            md3
            xl1
            lg1
            class="pb-3 ma-2"
          >
            <plexthumb
              :content="movie"
              :server="movie.server"
              show-server
              search
              @contentSet="setContent(movie)"
            />
          </v-col>
        </v-row>

        <v-row
          v-if="filteredShows && filteredShows.length > 0"
          row
          wrap
        >
          <!--Shows-->
          <v-col
            xs12
            lg12
          >
            <v-subheader>TV Shows ({{ filteredShows.length }})</v-subheader>
          </v-col>
          <v-col
            v-for="show in filteredShows"
            :key="show.key"
            xs6
            md3
            xl1
            lg1
            class="pb-3 ma-2"
          >
            <plexthumb
              :content="show"
              :server="show.server"
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
            xs12
            lg12
          >
            <v-subheader>TV Episodes ({{ filteredEpisodes.length }})</v-subheader>
          </v-col>
          <v-col
            v-for="episode in filteredEpisodes"
            :key="episode.key"
            xs6
            md3
            xl2
            lg2
            class="pb-3 ma-2"
          >
            <plexthumb
              :content="episode"
              :server="episode.server"
              show-server
              type="art"
              search
              @contentSet="setContent(episode)"
            />
          </v-col>
        </v-row>
      </div>
    </div>

    <v-divider />

    <template
      v-if="GET_LASTSERVER && results.length == 0"
    >
      <v-subheader v-if="subsetOnDeck().length > 0">
        Continue watching from {{ GET_LASTSERVER.name }}
        <span
          style="float:right; font-size:5rem; user-select: none;"
        >
          <v-icon
            style="margin-right: 15px;cursor: pointer"
            :style="onDeckDownStyle"
            @click="onDeckDown"
          >angle-left</v-icon>
          <v-icon
            :style="onDeckUpStyle"
            style="cursor: pointer"
            @click="onDeckUp"
          >angle-right</v-icon>
        </span>
      </v-subheader>

      <v-container fluid>
        <v-row
          v-if="onDeck"
          justify="center"
        >
          <v-col
            v-for="content in subsetOnDeck()"
            :key="content.key"
            cols="3"
            class="pb-3 pa-2"
          >
            <plexthumb
              :content="content"
              :server="GET_LASTSERVER"
              type="art"
              @contentSet="setContent(content)"
            />
          </v-col>
        </v-row>
      </v-container>
    </template>

    <v-divider />

    <template
      v-if="results.length == 0"
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

      <v-container fluid>
        <v-row>
          <v-col
            v-if="Object.keys(getPlex.servers).length === 0"
            xs12
          >
            <h5>
              No Plex Servers found.
              Make sure your server owner has shared libraries with you!
            </h5>
          </v-col>

          <v-col
            v-for="server in getPlex.servers"
            :key="server.clientIdentifier"
            cols="4"
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
                    <v-col xs4>
                      <v-img
                        :src="getLogos.plex.standard"
                        height="110px"
                        contain
                      />
                    </v-col>
                    <v-col
                      xs8
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
                          v-if="!isConnectable(server)"
                          class="red--text"
                        >
                          Unable to connect
                        </div>

                        <div
                          v-if="!isConnectable(server)"
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
      </v-container>
    </template>
  </div>
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

      results: [],
      onDeckOffset: 0,
      onDeck: null,
      searchWord: '',
      searchStatus: 'Search your available Plex Media Servers',
      searching: false,
      serversHeardBack: [],
    };
  },

  computed: {
    ...mapGetters([
      'GET_LASTSERVER',
      'getPlex',
      'getLogos',
      'GET_CONNECTABLE_PLEX_SERVERS',
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
      return this.results.filter((item) => {
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
      return this.results.filter((item) => {
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
      return this.results.filter((item) => {
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
      return this.results.filter((item) => {
        if (!item) {
          return false;
        }
        if (item.type === 'series') {
          return true;
        }
        return false;
      });
    },
  },

  watch: {
    searchWord() {
      if (this.searchWord === '') {
        this.results = [];
        this.searchStatus = 'Search your available Plex Media Servers';
        return;
      }
      this.searchAllServers();
    },
  },

  mounted() {
    this.updateOnDeck();
  },

  methods: {
    ...mapActions(['FETCH_PLEX_DEVICES']),
    setContent(content) {
      this.selectedItem = content;
    },

    isConnectable(server) {
      return (
        this.getPlex.servers[server.clientIdentifier]
        && this.getPlex.servers[server.clientIdentifier].chosenConnection
      );
    },

    async updateOnDeck() {
      if (this.GET_LASTSERVER) {
        this.onDeck = await this.GET_LASTSERVER.getOnDeck(0, 10);
      }
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

    ownerOfServer(server) {
      if (server.owned === '1') {
        return 'you';
      }
      return server.sourceTitle;
    },

    heardBack(server) {
      return this.serversHeardBack
        .find((serv) => serv.clientIdentifier === server.clientIdentifier);
    },


    searchAllServers: debounce(function search() {
      if (this.searchWord === '') {
        this.results = [];
        this.searchStatus = 'Search your available Plex Media Servers';
        return;
      }

      this.searching = true;
      this.results = [];
      this.serversResponded = 0;
      const storedWord = this.searchWord;

      this.GET_CONNECTABLE_PLEX_SERVERS.forEach((server) => {
        server.search(this.searchWord).then((serverSearchResults) => {
          if (storedWord !== this.searchWord) {
            // Old data
            return;
          }
          this.serversResponded += 1;
          this.serversHeardBack.push(server);

          if (serverSearchResults) {
            this.results = this.results.concat(serverSearchResults.map((results) => ({
              ...results,
              server,
            })));
          }

          this.searchStatus = `Found ${this.results.length} results from ${
            this.serversResponded
          } servers`;

          if (this.serversResponded === Object.keys(this.getPlex.servers).length) {
            this.searching = false;
          }
        });
      });
    }, 1000),
  },
};
</script>
