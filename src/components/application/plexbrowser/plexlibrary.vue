<template>
    <span style="height:100%">
        <span>
          <span v-on:click="reset()" style="cursor: pointer !important"> {{ library.title }} <span v-if="browsingContent"> > </span></span>        
          <v-layout v-if="!contents && !browsingContent" row>
              <v-flex xs12 style="position:relative">
                  <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
              </v-flex>
          </v-layout>

        </span>
        <div v-if="!browsingContent && contents" class="mt-3" style="height:90vh; overflow-y:scroll ">
          <v-layout class="row" row wrap>
                <v-flex xs4 md3 xl1 lg2  class="pb-3" v-for="content in contents.MediaContainer.Metadata" :key="content.key">
                  <plexthumb :content="content" :server="server" type="thumb"  @contentSet="setContent(content)"></plexthumb>
                </v-flex>
            </v-layout>  
            <v-layout row>
              <v-flex xs12 v-if="contents && !browsingContent && !stopNewContent" v-observe-visibility="getMoreContent" justify-center>
                Loading...
              </v-flex>  
            </v-layout>   
        </div>        
        <plexalbum v-if="browsingContent && browsingContent.type == 'album'" :content="browsingContent" :server="server"
                    :library="library"></plexalbum>
        <plexartist v-if="browsingContent && browsingContent.type == 'artist'" :content="browsingContent" :server="server"
                    :library="library"></plexartist>
        <plexcontent v-if="browsingContent && (browsingContent.type == 'movie' || browsingContent.type == 'series') " :content="browsingContent"
                     :server="server" :library="library"></plexcontent>
        <plexseries v-if="browsingContent && browsingContent.type == 'show'" :content="browsingContent" :server="server"
                    :library="library"></plexseries>        

    </span>
</template>

<script>
  import plexcontent from './plexcontent'
  import plexseries from './plexseries'  
  import plexalbum from './plexalbum'  
  import plexthumb from './plexthumb'
  import plexartist from './plexartist'

  var _ = require('lodash');
  export default {
    props: ['library', 'server'],
    components: {
      plexcontent,
      plexseries,
      plexthumb,
      plexalbum,
      plexartist
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this
      this.getMoreContent()
    },
    data () {
      return {
        browsingContent: null,
        startingIndex: 0,
        size: 100,
        libraryTotalSize: false,

        stopNewContent: false,
        busy: false,
        contents: null,
        status: "loading..",
        searchPhrase: null
      }
    },
    mounted () {
    },
    beforeDestroy () {

    },
    computed: {},
    methods: {
      setContent (content) {
        this.browsingContent = content
      },
      handler (component) {
        console.log(component)
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.thumb, w / 6, h / 4)
      },
      setBackground () {        
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

        let randomItem = _.sample(this.contents.MediaContainer.Metadata)
        let url = randomItem.thumb 
        if (randomItem.type == 'show') {
          url = randomItem.art
        }
        this.$store.commit('SET_BACKGROUND',this.server.getUrlForLibraryLoc(url, w / 4, h / 4, 8))
      },
      isShown (item) {
        if (!item.active) {
          return {
            display: 'none'
          }
        }
        return {}
      },
      getTitleMovie(movie){
        if (movie.year){
          return movie.title + ' (' + movie.year + ')'
        }
        return movie.title
      },
      filterItems: _.debounce(
        function () {
          for (let i = 0; i < this.contents.MediaContainer.Metadata.length; i++) {
            let item = this.contents.MediaContainer.Metadata[i]
            if (!this.searchPhrase) {
              item.active = true
              continue
            }
            if (item.title.toLowerCase().indexOf(this.searchPhrase.toLowerCase()) > -1) {
              item.active = true
            } else {
              item.active = false
            }
          }
        },
        500
      ),
      getMoreContent () {
        if (this.stopNewContent || this.busy) {
          return
        }
        console.log('We need to get more content!')
        var that = this
        this.busy = true
        this.server.getLibraryContents(this.library.key, this.startingIndex, this.size, function (result) {
          console.log('Metadata result', result)
          if (result && result.MediaContainer && result.MediaContainer.Metadata) {
            that.libraryTotalSize = result.MediaContainer.totalSize
            that.startingIndex = that.startingIndex + 100
            if (that.contents) {
              for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
                let media = result.MediaContainer.Metadata[i]
                media.active = true
                that.contents.MediaContainer.Metadata.push(media)
              }
            } else {
              for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
                let media = result.MediaContainer.Metadata[i]
                media.active = true
              }
              that.contents = result
              that.setBackground()
            }
            if (result.MediaContainer.size < 100) {
              that.stopNewContent = true
            }

          } else {
            that.status = 'Error loading libraries!'
          }
          that.busy = false
        })
      },
      reset () {
        this.browsingContent = false
        this.setBackground()
      }

    }
  }
</script>
