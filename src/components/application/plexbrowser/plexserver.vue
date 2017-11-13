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
            <v-layout row wrap>
              <v-flex xs6 md3 xl2 lg2 v-if="libraries && !browsingLibrary" v-for="library in filteredLibraries" :key="library.name">
                  <v-card v-on:click="setLibrary(library)" :img="getArtLibrary(library)" height="10em" class="text-xs-center hoverable card" style="max-width:100%">
                      <div style="position:relative;width:100%;background: rgba(0,0,0,0.4); height:8em">
                          <img style="height: 70%;display: block; margin-left: auto; margin-right: auto " :src="getThumb(library)"/>
                      </div>                      
                      <div style="background: rgba(0,0,0,0.7); position:relative;; width:100%; height:2em">
                          <div class="truncate text-xs-center" style="font-size:1.3em">{{ library.title }}</div>
                      </div>
                  </v-card>
              </v-flex>
            </v-layout>
            <v-divider v-if="onDeck" class="mt-3 ma-2"></v-divider>
            <h4 v-if="subsetOnDeck(3).length > 0"> On Deck 
              <span style="float:right; font-size:5rem; user-select: none;">
                <v-icon fa @click="onDeckDown" style="margin-right: 15px;cursor: pointer" :style="onDeckDownStyle">angle-left</v-icon><v-icon fa @click="onDeckUp" :style="onDeckUpStyle" style="cursor: pointer">angle-right</v-icon>
              </span>
            </h4>
            <v-layout v-if="onDeck" row wrap>
                <v-flex xs12 md3 xl3 lg3 class="pb-3 pa-4" v-for="content in subsetOnDeck(4)" :key="content.key" >                    
                    <plexthumb :content="content" :server="server" type="art" :height="20" @contentSet="setContent(content)"></plexthumb>
                </v-flex>
            </v-layout>
            <v-divider v-if="subsetRecentlyAdded(3).length > 0" class="mt-3 ma-2"></v-divider>
            <h4 v-if="subsetRecentlyAdded(3).length > 0"> Recently Added 
              <span style="float:right; font-size:5rem; user-select: none; ">
                <v-icon fa @click="recentlyAddedDown" style="margin-right: 15px;cursor: pointer;" :style="recentlyAddedDownStyle">angle-left</v-icon><v-icon fa :style="recentlyAddedUpStyle"  @click="recentlyAddedUp" style="cursor: pointer" >angle-right</v-icon>
              </span>
            </h4>      
            <v-layout v-if="recentlyAdded" class="row" row wrap justify-space-between>
                <v-flex xs4 md3 xl1 lg1  class="pb-3" v-for="content in subsetRecentlyAdded(10)" :key="content.key">
                    <plexthumb :content="content" :server="server" type="thumb" fullTitle locked @contentSet="setContent(content)"></plexthumb>
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
            <plexalbum v-if="selectedItem.type == 'album'" :server="server" :content="selectedItem">
            </plexalbum>
        </span>
        <plexlibrary v-if="browsingLibrary" :library="browsingLibrary" :server="server"></plexlibrary>
    </span>
</template>

<script>

  import plexcontent from './plexcontent'
  import plexseason from './plexseason'
  import plexalbum from './plexalbum'
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
      plexthumb,
      plexalbum
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
        onDeck: null,

        onDeckOffset: 0,
        recentlyAddedOffset: 0
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
      this.updateOnDeck()
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
      onDeckUpStyle () {
        if ((this.onDeckOffset + 4) >= this.onDeck.MediaContainer.Metadata.length){
          return {
            opacity: 0.5
          }
        }
      },
      onDeckDownStyle () {
        if (this.onDeckOffset == 0){
          return {
            opacity: 0.5
          }
        }
      },
      recentlyAddedDownStyle () {
        if (this.recentlyAddedOffset == 0){
          return {
            opacity: 0.5
          }
        }
      },     
      recentlyAddedUpStyle () {
        if ((this.recentlyAddedOffset + 10) >= this.recentlyAdded.MediaContainer.Metadata.length){
          return {
            opacity: 0.5
          }
        }
      },

    },
    methods: {
      setContent (content) {
        this.selectedItem = content
      },
      setLibrary (library) {
        this.browsingLibrary = library
      },
      updateOnDeck() {
        this.server.getOnDeck(0, 10, (result) => {
          if (result) {
            this.onDeck = result
          }
        })
      },
      onDeckDown (){        
        if (!this.onDeck || !this.onDeck.MediaContainer || !this.onDeck.MediaContainer.Metadata){
            return false
        }
        if (this.onDeckOffset - 4 < 0){
          this.onDeckOffset = 0
        } else {
          this.onDeckOffset = this.onDeckOffset - 4
        }

      },
      onDeckUp () {        
        if (!this.onDeck || !this.onDeck.MediaContainer || !this.onDeck.MediaContainer.Metadata){
            return false
        }
        if (this.onDeckOffset + 4 >= this.onDeck.MediaContainer.Metadata.length){
          // This would overflow!
        } else {
          this.onDeckOffset = this.onDeckOffset + 4
        }

      },
      recentlyAddedUp () {        
        if (!this.recentlyAdded || !this.recentlyAdded.MediaContainer || !this.recentlyAdded.MediaContainer.Metadata){
            return false
        }
        if (this.recentlyAddedOffset + 10 >= this.recentlyAdded.MediaContainer.Metadata.length ){
          // This would overflow!
        } else {
          this.recentlyAddedOffset = this.recentlyAddedOffset + 10
        }
      },
      recentlyAddedDown () {
        if (!this.recentlyAdded || !this.recentlyAdded.MediaContainer || !this.recentlyAdded.MediaContainer.Metadata){
            return false
        }
        if (this.recentlyAddedOffset - 10 < 0){
          this.recentlyAddedOffset = 0
        } else {
          this.recentlyAddedOffset = this.recentlyAddedOffset - 10
        }
      },  
      setBackground () {        
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

        let randomItem = _.sample(this.recentlyAdded.MediaContainer.Metadata)
        let url = randomItem.art 
        this.$store.commit('SET_BACKGROUND',this.server.getUrlForLibraryLoc(url, w / 4, h / 1, 6))
      },
      subsetOnDeck (size) {
        if (!this.onDeck || !this.onDeck.MediaContainer || !this.onDeck.MediaContainer.Metadata){
            return []
        }
        return this.onDeck.MediaContainer.Metadata.slice(this.onDeckOffset, this.onDeckOffset + size)
      },
      subsetRecentlyAdded (size) {        
        if (!this.recentlyAdded || !this.recentlyAdded.MediaContainer || !this.recentlyAdded.MediaContainer.Metadata){
            return []
        }
        return this.recentlyAdded.MediaContainer.Metadata.slice(this.recentlyAddedOffset, this.recentlyAddedOffset + size)
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
      getArtLibrary (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.art, w / 1, h / 1, 15)
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.thumb, w / 4, h / 4)
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
        this.updateOnDeck()
        this.browsingLibrary = false
        this.selectedItem = false
        this.setBackground()
      }

    }
  }
</script>
