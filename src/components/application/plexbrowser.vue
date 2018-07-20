<template>
  <div>
    <div>
      <h4> Search </h4>
      <div>
        <v-layout class="mb-3" v-if="!selectedItem && !browsingServer" row wrap>
          <v-flex xs10 lg4>
            <v-text-field
              name="searchInput"
              label="Search"
              :hint="searchStatus"
              id="testing"
              persistent-hint
              single-line
              prepend-icon="search"
              v-model="searchWord"
            ></v-text-field>
          </v-flex>
          <v-flex xs2>
            <v-icon v-if="results.length > 0" v-on:click="results = []; searchWord = ''; searching = false" class="clickable red--text pt-3">clear</v-icon>
          </v-flex>
        </v-layout>
        <v-layout row wrap v-if="searching || results.length > 0">
          <v-chip v-for="server in plex.servers" :key="server.machineIdentifier" outline class="green darken-3 white--text">
            <v-avatar>
              <v-icon v-if="!heardBack(server)">clear</v-icon>
              <v-icon v-if="heardBack(server)">check_circle</v-icon>
            </v-avatar>
            {{ server.name }}
          </v-chip>
        </v-layout>
        <v-progress-circular v-if="searching" indeterminate class="amber--text"></v-progress-circular>
        <div v-if="results.length > 0">
          <v-layout v-if="filteredMovies && filteredMovies.length > 0" row wrap>
            <!--Movies-->
            <v-flex xs12 lg12 >
              <v-subheader > Movies ({{ filteredMovies.length }})</v-subheader>
            </v-flex>
            <v-flex xs6 md3 xl1 lg1 class="pb-3 ma-2" v-for="movie in filteredMovies" :key="movie.key">
              <plexthumb :content="movie" :server="movie.server" showServer search @contentSet="setContent(movie)"></plexthumb>
            </v-flex>
          </v-layout>
          <v-layout v-if="filteredShows && filteredShows.length > 0" row wrap>
            <!--Shows-->
            <v-flex xs12 lg12 >
              <v-subheader > TV Shows ({{ filteredShows.length }})</v-subheader>
            </v-flex>
            <v-flex xs6 md3 xl1 lg1 class="pb-3 ma-2" v-for="show in filteredShows" :key="show.key">
              <plexthumb :content="show" :server="show.server" showServer search @contentSet="setContent(show)"></plexthumb>
            </v-flex>
          </v-layout>
          <v-layout v-if="filteredEpisodes && filteredEpisodes.length > 0" row wrap>
            <!--Episodes-->
            <v-flex xs12 lg12 >
              <v-subheader > TV Episodes ({{ filteredEpisodes.length }})</v-subheader>
            </v-flex>
            <v-flex xs6 md3 xl2 lg2 class="pb-3 ma-2" v-for="episode in filteredEpisodes" :key="episode.key">
              <plexthumb :content="episode" :server="episode.server" showServer type="art" search @contentSet="setContent(episode)"></plexthumb>
            </v-flex>
          </v-layout>
        </div>
      </div>
      <v-divider></v-divider>
      <div class="pt-4" v-if="validLastServer && results.length == 0">
        <h4 v-if="subsetOnDeck().length > 0"> Continue watching from {{ lastServer.name }}
          <span style="float:right; font-size:5rem; user-select: none;">
            <v-icon @click="onDeckDown" style="margin-right: 15px;cursor: pointer" :style="onDeckDownStyle">angle-left</v-icon><v-icon @click="onDeckUp" :style="onDeckUpStyle" style="cursor: pointer">angle-right</v-icon>
          </span>
        </h4>
        <v-layout v-if="onDeck" row justify-center>
          <v-flex xs12 md3 class="pb-3 pa-2" v-for="content in subsetOnDeck()" :key="content.key" >
            <plexthumb :content="content" :server="lastServer" type="art" @contentSet="setContent(content)"></plexthumb>
          </v-flex>
        </v-layout>
      </div>
      <v-divider></v-divider>
      <div class="pt-4" v-if="results.length == 0">
        <h4> Browse </h4>
        <v-layout row wrap>
          <v-flex xs12 lg4 md6 xl3 v-for="server in plex.servers" :key="server.clientIdentifier" class="pa-2">
            <router-link :to="'/browse/' + server.clientIdentifier">
              <v-card class="white--text" horizontal height="10em" style="cursor: pointer; z-index: 0; background: rgba(0,0,0,0.4);">
                <v-container fill-height>
                  <v-layout row justify-center align-center>
                    <v-flex xs4>
                      <v-card-media
                          :src="logos.plex.standard"
                          height="110px"
                          contain
                        ></v-card-media>
                    </v-flex>
                    <v-flex xs8 class="pl-2">
                      <div style="overflow: hidden">
                        <h1>{{ server.name }}</h1>
                        <h4 style="opacity: 0.9"> v{{ server.productVersion }}</h4>
                        <div>Owned by {{ ownerOfServer(server) }}</div>
                        <div v-if="!isConnectable(server)" class="red--text">Unable to connect</div>
                        <div v-if="!isConnectable(server)" class="red--text" style="font-size: 10px">Try disabling your adblocker</div>
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
import plexthumb from './plexbrowser/plexthumb'

var _ = require('lodash')

export default {
  components: {
    plexthumb
  },
  name: 'plexbrowser',
  mounted () {
    this.updateOnDeck()
  },
  methods: {
    setContent (content) {
      this.selectedItem = content
    },
    setServer (server) {
      this.browsingServer = server
    },
    isConnectable (server) {
      return this.plex.servers[server.clientIdentifier] && this.plex.servers[server.clientIdentifier].chosenConnection
    },
    updateOnDeck: async function () {
      if (this.lastServer) {
        this.onDeck = await this.lastServer.getOnDeck(0, 10)
      }
    },
    subsetOnDeck (size) {
      if (!this.onDeck || !this.onDeck.MediaContainer || !this.onDeck.MediaContainer.Metadata) {
        return []
      }
      return this.onDeck.MediaContainer.Metadata.slice(this.onDeckOffset, this.onDeckOffset + this.onDeckItemsPer)
    },
    reset () {
      this.updateOnDeck()
      this.browsingServer = false
      this.selectedItem = false
      this.results = []
      this.searchWord = ''
      this.searching = false
      this.setBackground()
      // this.$store.commit('SET_BACKGROUND',null)
    },
    onDeckDown () {
      if (!this.onDeck || !this.onDeck.MediaContainer || !this.onDeck.MediaContainer.Metadata) {
        return false
      }
      if (this.onDeckOffset - 4 < 0) {
        this.onDeckOffset = 0
      } else {
        this.onDeckOffset = this.onDeckOffset - 4
      }
    },
    onDeckUp () {
      if (!this.onDeck || !this.onDeck.MediaContainer || !this.onDeck.MediaContainer.Metadata) {
        return false
      }
      if (this.onDeckOffset + 4 >= this.onDeck.MediaContainer.Metadata.length) {
        // This would overflow!
      } else {
        this.onDeckOffset = this.onDeckOffset + 4
      }
    },
    ownerOfServer (server) {
      if (server.owned === '1') {
        return 'you'
      } else {
        return server.sourceTitle
      }
    },
    setBackground () {
      // this.$store.commit('SET_RANDOMBACKROUND')
      // this.$store.commit('SET_BACKROUND',null)
    },
    getThumb (object) {
      var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0))
      var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0))
      return object.server.getUrlForLibraryLoc(object.thumb, w / 4, h / 4)
    },
    getArt (object) {
      var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0))
      var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0))
      return object.server.getUrlForLibraryLoc(object.art, w / 4, h / 4)
    },
    getTitleMovie (movie) {
      if (movie.year) {
        return movie.title + ' (' + movie.year + ')'
      }
      return movie.title
    },
    heardBack (server) {
      for (let i = 0; i < this.serversHeardBack.length; i++) {
        let tempserver = this.serversHeardBack[i]
        if (tempserver.clientIdentifier === server.clientIdentifier) {
          return true
        }
      }
      return false
    },
    searchAllServers: _.debounce(function () {
      if (this.searchWord === '') {
        this.results = []
        this.searchStatus = 'Search your available Plex Media Servers'
        return
      }
      this.searching = true
      this.results = []
      this.serversResponded = 0
      let storedWord = this.searchWord
      for (let i in this.plex.servers) {
        let server = this.plex.servers[i]
        server.search(this.searchWord).then(serverSearchResults => {
          if (storedWord !== this.searchWord) {
            // Old data
            return
          }
          this.serversResponded++
          this.serversHeardBack.push(server)
          if (serverSearchResults) {
            for (let j = 0; j < serverSearchResults.length; j++) {
              serverSearchResults[j].server = server
            }
            this.results = this.results.concat(serverSearchResults)
          }
          this.searchStatus = 'Found ' + this.results.length + ' results from ' + this.serversResponded + ' servers'
          if (this.serversResponded === Object.keys(this.plex.servers).length) {
            this.searching = false
          }
        })
      }
    }, 1000)
  },
  data () {
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
      serversHeardBack: []
    }
  },
  watch: {
    searchWord () {
      if (this.searchWord === '') {
        this.results = []
        this.searchStatus = 'Search your available Plex Media Servers'
        return
      }
      this.searchAllServers()
    }
  },
  computed: {
    plex () {
      return this.$store.getters.getPlex
    },
    onDeckItemsPer () {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs': return 1
        case 'sm': return 2
        case 'md': return 4
        case 'lg': return 4
        case 'xl': return 4
      }
    },
    availableServers () {
      let servers = this.plex.servers.filter(function (server) {
        if (server.chosenConnection) {
          return true
        }
        return false
      })
      return servers
    },
    validLastServer () {
      return (
        this.$store.getters.getSettingLASTSERVER &&
        this.plex.servers[this.$store.getters.getSettingLASTSERVER]
      )
    },
    lastServer () {
      return this.plex.servers[this.$store.getters.getSettingLASTSERVER]
    },
    onDeckUpStyle () {
      if (this.onDeckOffset + 3 >= this.onDeck.MediaContainer.Metadata.length) {
        return {
          opacity: 0.5
        }
      }
    },
    onDeckDownStyle () {
      if (this.onDeckOffset === 0) {
        return {
          opacity: 0.5
        }
      }
    },
    filteredShows () {
      return this.results.filter(item => {
        if (!item) {
          return false
        }
        if (item.type === 'show') {
          return true
        }
        return false
      })
    },
    filteredEpisodes () {
      return this.results.filter(item => {
        if (!item) {
          return false
        }
        if (item.type === 'episode') {
          return true
        }
        return false
      })
    },
    filteredMovies () {
      return this.results.filter(item => {
        if (!item) {
          return false
        }
        if (item.type === 'movie') {
          return true
        }
        return false
      })
    },
    filteredSeasons () {
      return this.results.filter(item => {
        if (!item) {
          return false
        }
        if (item.type === 'series') {
          return true
        }
        return false
      })
    }
  }
}
</script>
