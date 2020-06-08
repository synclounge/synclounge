<template>
  <div>
    <div>
      <h4>Search</h4>
      <div>
        <v-layout
          v-if="!selectedItem && !browsingServer"
          class="mb-3"
          row
          wrap
        >
          <v-flex
            xs10
            lg4
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
          </v-flex>
          <v-flex xs2>
            <v-icon
              v-if="results.length > 0"
              class="clickable red--text pt-3"
              @click="results = []; searchWord = ''; searching = false"
            >
              clear
            </v-icon>
          </v-flex>
        </v-layout>
        <v-layout
          v-if="searching || results.length > 0"
          row
          wrap
        >
          <v-chip
            v-for="server in getPlex.servers"
            :key="server.machineIdentifier"
            outline
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
        </v-layout>
        <v-progress-circular
          v-if="searching"
          indeterminate
          class="amber--text"
        />
        <div v-if="results.length > 0">
          <v-layout
            v-if="filteredMovies && filteredMovies.length > 0"
            row
            wrap
          >
            <!--Movies-->
            <v-flex
              xs12
              lg12
            >
              <v-subheader>Movies ({{ filteredMovies.length }})</v-subheader>
            </v-flex>
            <v-flex
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
            </v-flex>
          </v-layout>
          <v-layout
            v-if="filteredShows && filteredShows.length > 0"
            row
            wrap
          >
            <!--Shows-->
            <v-flex
              xs12
              lg12
            >
              <v-subheader>TV Shows ({{ filteredShows.length }})</v-subheader>
            </v-flex>
            <v-flex
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
            </v-flex>
          </v-layout>
          <v-layout
            v-if="filteredEpisodes && filteredEpisodes.length > 0"
            row
            wrap
          >
            <!--Episodes-->
            <v-flex
              xs12
              lg12
            >
              <v-subheader>TV Episodes ({{ filteredEpisodes.length }})</v-subheader>
            </v-flex>
            <v-flex
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
            </v-flex>
          </v-layout>
        </div>
      </div>
      <v-divider />
      <div
        v-if="GET_LASTSERVER && results.length == 0"
        class="pt-4"
      >
        <h4 v-if="subsetOnDeck().length > 0">
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
        </h4>
        <v-layout
          v-if="onDeck"
          row
          justify-center
        >
          <v-flex
            v-for="content in subsetOnDeck()"
            :key="content.key"
            xs12
            md3
            class="pb-3 pa-2"
          >
            <plexthumb
              :content="content"
              :server="GET_LASTSERVER"
              type="art"
              @contentSet="setContent(content)"
            />
          </v-flex>
        </v-layout>
      </div>
      <v-divider />
      <div
        v-if="results.length == 0"
        class="pt-4"
      >
        <h4>
          Browse
          <v-icon
            class="pl-2"
            small
            @click="PLEX_GET_DEVICES"
          >
            refresh
          </v-icon>
        </h4>
        <v-layout
          row
          wrap
        >
          <v-flex
            v-if="Object.keys(getPlex.servers).length === 0"
            xs12
          >
            <h5>
              No Plex Servers found.
              Make sure your server owner has shared libraries with you!
            </h5>
          </v-flex>
          <v-flex
            v-for="server in getPlex.servers"
            :key="server.clientIdentifier"
            xs12
            lg4
            md6
            xl3
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
                  <v-layout
                    row
                    justify-center
                    align-center
                  >
                    <v-flex xs4>
                      <v-img
                        :src="getLogos.plex.standard"
                        height="110px"
                        contain
                      />
                    </v-flex>
                    <v-flex
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
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card>
            </router-link>
          </v-flex>
        </v-layout>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { debounce } from 'lodash';
import plexthumb from './plexbrowser/plexthumb.vue';


export default {
  name: 'Plexbrowser',
  components: {
    plexthumb,
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

    availableServers() {
      const servers = this.getPlex.servers.filter((server) => {
        if (server.chosenConnection) {
          return true;
        }
        return false;
      });
      return servers;
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
    ...mapActions(['PLEX_GET_DEVICES']),
    setContent(content) {
      this.selectedItem = content;
    },
    setServer(server) {
      this.browsingServer = server;
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
    reset() {
      this.updateOnDeck();
      this.browsingServer = false;
      this.selectedItem = false;
      this.results = [];
      this.searchWord = '';
      this.searching = false;
      this.setBackground();
      // this.$store.commit('SET_BACKGROUND',null)
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

    setBackground() {
      // this.$store.commit('SET_RANDOMBACKROUND')
      // this.$store.commit('SET_BACKROUND',null)
    },

    getThumb(object) {
      const w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      );
      const h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
      );
      return object.server.getUrlForLibraryLoc(object.thumb, w / 4, h / 4);
    },

    getArt(object) {
      const w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      );
      const h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
      );
      return object.server.getUrlForLibraryLoc(object.art, w / 4, h / 4);
    },

    getTitleMovie(movie) {
      if (movie.year) {
        return `${movie.title} (${movie.year})`;
      }
      return movie.title;
    },

    heardBack(server) {
      return this.serversHeardBack
        .find((serv) => serv.clientIdentifier === server.clientIdentifier);
    },

    searchAllServers: debounce(() => {
      if (this.searchWord === '') {
        this.results = [];
        this.searchStatus = 'Search your available Plex Media Servers';
        return;
      }

      this.searching = true;
      this.results = [];
      this.serversResponded = 0;
      const storedWord = this.searchWord;

      this.getPlex.servers.forEach((server) => {
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
