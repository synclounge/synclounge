<template>
  <div>
    <span v-if="browsingServer || selectedItem">
      <v-icon v-on:click="reset()" light>home</v-icon>
    </span>
    <div v-if="!browsingServer && !selectedItem && !browsingContent">
      <h5> Search </h5>
      <v-layout v-if="!selectedItem && !browsingServer" row wrap>
        <v-flex xs12 lg4>
          <v-text-field
            name="searchInput"
            label="Search"
            hint="Search all of your available Plex Media Servers"
            id="testing"
            persistent-hint
            light
            single-line
            prepend-icon="search"
            v-model="searchWord"
          ></v-text-field>
        </v-flex>
        <v-icon v-if="results.length > 0" v-on:click="results = []; searchWord = ''" style="cursor:pointer" class="red--text">clear</v-icon>
      </v-layout> 
      <v-layout row wrap v-if="searching || results.length > 0">    
         <v-chip v-for="server in plex.servers" :key="server" outline class="blue white--text">
           <v-avatar>
             <v-icon v-if="!heardBack(server)">clear</v-icon>
            <v-icon v-if="heardBack(server)">check_circle</v-icon>
          </v-avatar>
          {{ server.name }} 
         </v-chip>         
      </v-layout>
      <v-progress-circular v-if="searching" indeterminate class="amber--text"></v-progress-circular>
      <div v-if="results.length > 0">
        <v-subheader class="white--text" v-text="searchStatus"></v-subheader>
        <v-layout v-if="filteredMovies && filteredMovies.length > 0" row wrap>
          <!--Movies-->
          <v-flex xs12 lg12 >
            <h6> Movies ({{filteredMovies.length}})</h6>
          </v-flex>          
          <v-flex xs6 md3 xl1 lg2 class="mb-3" v-for="movie in filteredMovies" :key="movie">
            <div class="portrait">
              <v-card v-on:click="setContent(movie)" >                  
                  <small style="position:absolute; top:0;text-align:right;right:0;background: rgba(0, 0, 0, .3)"> {{movie.server.name}}</small>                    
                  <v-card-row class="grey darken-4" :img="getThumb(movie)" height="20em">  </v-card-row>                       
                  <v-card-row style="background: rgba(0, 0, 0, .3)">
                      <div> {{ getTitleMovie(movie) }} </div>
                    </v-card-row>            
                </v-card>       
              </v-card>
            </div>
          </v-flex>
        </v-layout>
        <v-layout v-if="filteredShows && filteredShows.length > 0" row wrap>
          <!--Shows-->
          <v-flex xs12 lg12 >
            <h6> TV Shows ({{filteredShows.length}})</h6>
          </v-flex>          
          <v-flex xs6 md3 xl1 lg2 class="mb-3" v-for="show in filteredShows" :key="show">
            <div class="portrait">
              <v-card v-on:click="setContent(show)" >    
                  <small style="position:absolute; top:0;text-align:right;right:0;background: rgba(0, 0, 0, .3)"> {{show.server.name}}</small>                  
                  <v-card-row class="grey darken-4" :img="getThumb(show)" height="20em">  </v-card-row>                       
                  <v-card-row style="background: rgba(0, 0, 0, .3)">
                      <div> {{ getTitleMovie(show) }} </div>
                    </v-card-row>                 
                </v-card>       
              </v-card>
            </div>
          </v-flex>
        </v-layout>        
        <v-layout v-if="filteredEpisodes && filteredEpisodes.length > 0" row wrap>
          <!--Episodes-->
          <v-flex xs12 lg12 >
            <h6> TV Episodes ({{filteredEpisodes.length}})</h6>
          </v-flex>          
          <v-flex xs6 md3 xl1 lg2 class="mb-3" v-for="episode in filteredEpisodes" :key="episode">
            <div class="portrait">
              <v-card v-on:click="setContent(episode)" >    
                  <small style="position:absolute; top:0;text-align:right;right:0;background: rgba(0, 0, 0, .3)"> {{episode.server.name}}</small>           
                  <v-card-row class="grey darken-4" :img="getThumb(episode)" height="10em">  </v-card-row>                       
                  <v-card-row style="background: rgba(0, 0, 0, .3)">
                      {{ episode.title }}
                  </v-card-row>
                  <v-card-row style="background: rgba(0, 0, 0, .3)">
                     <label> {{ episode.grandparentTitle }} S{{ episode.parentIndex }}E{{episode.index}} </label> 
                  </v-card-row>       
                </v-card>       
              </v-card>
            </div>
          </v-flex>
        </v-layout>
      </div>
      <div v-if="results.length == 0">
        <h5> Browse </h5>
        <v-layout row wrap>  
          <v-flex xs12 lg4 md6 xl3 v-for="server in plex.servers" :key="server" class="pa-2">  
            <v-card v-on:click="setServer(server)" class="grey darken-4" horizontal height="130px">
              <v-card-row img="static/plexlogo.png" height="100%" style="overflow:hidden !important"></v-card-row>
              <v-card-column>
                <v-card-row>
                  <v-card-text>
                    <strong>{{server.name}}</strong>
                    <div>Owned by {{ ownerOfServer(server) }}</div>
                    <label> v {{server.productVersion}}</label>
                  </v-card-text>
                </v-card-row>
                <v-divider></v-divider>                  
                <v-card-row actions>
                  <v-btn right flat class="white--text">
                    Browse
                  </v-btn>
              </v-card-row>
            </v-card-column> 
            </v-card>
         </v-flex>         
        </v-layout>
      </div> 
    </div>
    <span v-if="selectedItem">
      <plexcontent v-if="selectedItem.type == 'episode' || selectedItem.type == 'movie'"
                    :server="selectedItem.server" :content="selectedItem">
      </plexcontent>
      <plexseason v-if="selectedItem.type == 'series'" :server="selectedItem.server" :content="selectedItem">
      </plexseason>
      <plexseries v-if="selectedItem.type == 'show'" :server="selectedItem.server" :content="selectedItem">
      </plexseries>
    </span>
    <plexserver v-if="browsingServer" :server="browsingServer">
    </plexserver>   
  </div>
</template>

<script>
  import plexserver from './plexbrowser/plexserver'
  import plexcontent from './plexbrowser/plexcontent'
  import plexlibrary from './plexbrowser/plexlibrary'
  import plexseason from './plexbrowser/plexseason'
  import plexseries from './plexbrowser/plexseries'

  var _ = require('lodash');

  export default {
    components: {
      plexserver,
      plexcontent,
      plexlibrary,
      plexseason,
      plexseries
    },
    name: 'plexbrowser',
    methods: {
      setContent (content) {
        this.selectedItem = content
      },
      setServer (server) {
        this.browsingServer = server
      },
      reset () {
        console.log('resetting')
        this.browsingServer = false
        this.selectedItem = false
        this.results = []
        this.searchWord = ''
      },
      ownerOfServer (server) {
        if (server.owned == '1') {
          return 'you'
        } else {
          return server.sourceTitle
        }
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return object.server.getUrlForLibraryLoc(object.thumb, w / 4, h / 4)
      },
      getTitleMovie(movie){
        if (movie.year){
          return movie.title + ' (' + movie.year + ')'
        }
        return movie.title
      },
      heardBack (server) {
        for (let i = 0; i < this.serversHeardBack.length; i++) {
          let tempserver = this.serversHeardBack[i]
          if (tempserver.clientIdentifier == server.clientIdentifier){
            console.log('Yes')
            return true
          }
        }
        console.log('No')
        return false
      },
      searchAllServers: _.debounce(
        function () {
          if (this.searchWord == ''){
            this.results = []
            return
          }
          this.searching = true
          var vm = this
          this.results = []
          this.serversHeardBack = []
          this.serversResponded = 0
          let storedWord = this.searchWord
          for (let i = 0; i < this.plex.servers.length; i++) {
            let server = this.plex.servers[i]
            server.search(this.searchWord, (serverSearchResults) => {
              if (storedWord != this.searchWord){
                // Old data
                return
              }
              this.serversResponded++
              console.log(serverSearchResults)
              this.serversHeardBack.push(server)
              if (serverSearchResults) {
                for (let j = 0; j < serverSearchResults.length; j++) {
                  serverSearchResults[j].server = server
                }
                this.results = this.results.concat(serverSearchResults)
              }
              this.searchStatus = 'Found ' + this.results.length + ' results from ' + this.serversResponded + ' servers'
              if (this.serversResponded == this.plex.servers.length){
                this.searching = false
              }
            })
          }
        },
        1000
      )
    },
    data () {
      return {
        browsingServer: null,
        selectedItem: null,
        browsingContent: null,

        results: [],
        searchWord: '',
        searchStatus: '',
        searching: false,
        serversHeardBack: []
      }
    },
    watch: {
      searchWord () {
        if (this.searchWord == '') {
          return
        }
        this.searchAllServers()
      }
    },
    computed: {
      plex () {
        return this.$store.getters.getPlex
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
      filteredShows () {
        return this.results.filter((item) => {
          if (!item){
            return false
          }
          if (item.type == 'show') {
            return true
          }
          return false
        })
      },
      filteredEpisodes () {
        return this.results.filter((item) => {
          if (!item){
            return false
          }
          if (item.type == 'episode') {
            return true
          }
          return false
        })
      },
      filteredMovies () {
        return this.results.filter((item) => {
          if (!item){
            return false
          }
          if (item.type == 'movie') {
            return true
          }
          return false
        })
      },
      filteredSeasons () {
        return this.results.filter((item) => {
          if (!item){
            return false
          }
          if (item.type == 'series') {
            return true
          }
          return false
        })
      }
    }
  }
</script>

