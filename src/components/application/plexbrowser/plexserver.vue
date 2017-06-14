<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important">{{ server.name }}<span
          v-if="browsingLibrary || selectedItem"> ></span>
        </span>
        <v-layout v-if="!libraries && !browsingLibrary && !selectedItem" row align-center>
            <v-flex xs12 style="position: relative">
                <v-progress-circular style="left:50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
            </v-flex>
        </v-layout>
        <div v-if="!browsingLibrary && !selectedItem && libraries" class="mt-3">            
            <div v-if="!libraries && !browsingLibrary">
                <v-progress-circular active large></v-progress-circular>
            </div>
            <h4> Libraries </h4>
            <v-layout>
              <v-flex xs4 lg1 v-if="libraries && !browsingLibrary" v-for="library in filteredLibraries" :key="library">
                  <v-card v-on:click="setLibrary(library)" class="text-xs-center hoverable card">
                      <div>
                          <img :src="getThumb(library)" style="width:75%">
                      </div>
                      <div>
                          <span>{{ library.title }}</span>
                      </div>
                  </v-card>
              </v-flex>
            </v-layout>
            <v-divider v-if="onDeck" class="mt-3 ma-2"></v-divider>
            <h4 v-if="onDeck"> On Deck </h4>
            <v-layout v-if="onDeck" row wrap>
                <v-flex xs12 md4 xl4 lg4 class="pb-3" v-for="content in subsetOnDeck(3)" :key="content">                    
                    <plexthumb :content="content" :server="server" type="art" :height="'30em'"  @contentSet="setContent(content)"></plexthumb>

                </v-flex>
            </v-layout>
            <v-divider v-if="recentlyAdded" class="mt-3 ma-2"></v-divider>
            <h4 v-if="recentlyAdded"> Recently Added </h4>      
            <v-layout v-if="recentlyAdded" class="row" row wrap>
                <v-flex xs6 md3 xl1 lg2  class="pb-3" v-for="content in subsetRecentlyAdded(12)" :key="content">
                    <plexthumb :content="content" :server="server" type="thumb" @contentSet="setContent(content)"></plexthumb>
                </v-flex>
            </v-layout>  
        </div>
        <span v-if="selectedItem">
            <plexcontent v-if="selectedItem.type == 'episode' || selectedItem.type == 'movie'" :server="server"
                         :content="selectedItem">
            </plexcontent>
            <plexseason v-if="selectedItem.type == 'season'" :server="server" :content="selectedItem">
            </plexseason>
            <plexseries v-if="selectedItem.type == 'show'" :server="server" :content="selectedItem">
            </plexseries>
        </span>
        <plexlibrary v-if="browsingLibrary" :library="browsingLibrary" :server="server"></plexlibrary>
    </span>
</template>

<script>

  import plexcontent from './plexcontent'
  import plexseason from './plexseason'
  import plexseries from './plexseries'
  import plexlibrary from './plexlibrary'
  import plexthumb from './plexthumb'

  var _ = require('lodash');
  export default {
    props: ['server'],
    components: {
      plexlibrary,
      plexcontent,
      plexseason,
      plexseries,
      plexthumb
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this

    },
    data () {
      return {
        browsingLibrary: null,
        selectedItem: null,

        libraries: null,
        status: "loading..",

        recentlyAdded: null,
        onDeck: null
      }
    },
    mounted () {
      this.server.getAllLibraries((result) => {
        if (result) {
          this.libraries = result
        } else {
          this.status = 'Error loading libraries!'
        }
      })
      this.server.getRecentlyAddedAll(0, 12, (result) => {
        console.log('Recently added result', result)
        if (result) {
          this.recentlyAdded = result
          this.setBackground()
        }
      })
      this.server.getOnDeck(0, 10, (result) => {
        if (result) {
          this.onDeck = result
        }
      })

    },
    beforeDestroy () {

    },
    computed: {
      filteredLibraries () {
        if (this.libraries) {
          return this.libraries.MediaContainer.Directory
        }
        return []
      },

    },
    methods: {
      setContent (content) {
        this.selectedItem = content
      },
      setLibrary (library) {
        this.browsingLibrary = library
      },      
      setBackground () {        
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

        let randomItem = _.sample(this.recentlyAdded.MediaContainer.Metadata)
        let url = randomItem.art 
        this.$store.commit('SET_BACKGROUND',this.server.getUrlForLibraryLoc(url, w / 4, h / 1, 6))
      },
      subsetOnDeck (size) {
        return this.onDeck.MediaContainer.Metadata.slice(0, size)
      },
      subsetRecentlyAdded (size) {
        return this.recentlyAdded.MediaContainer.Metadata.slice(0, size)
      },
      progress (content) {
        let perc = (parseInt(content.viewOffset) / parseInt(content.duration)) * 100
        if (isNaN(perc)) {
          perc = 0
        }
        return perc + '%'
      },
      getArt (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.art, w / 1, h / 1)
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.thumb, w / 3, h / 4)
      },
      getTitleMovie(movie){
        if (movie.year){
          return movie.title + ' (' + movie.year + ')'
        }
        return movie.title
      },
      getGrandparentThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.grandparentThumb, w / 3, h / 4)
      },
      reset () {
        this.browsingLibrary = false
        this.selectedItem = false
        this.setBackground()
      }

    }
  }
</script>
