<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important"> {{ library.title }} <span v-if="browsingContent"> > </span></span>
        <div v-if="!browsingContent && contents" class="mt-3">
          <v-layout class="row" row wrap>
                <v-flex xs6 md3 xl1 lg2  class="pb-3" v-for="content in contents.MediaContainer.Metadata" :key="content">
                  <plexthumb :content="content" :server="server" type="thumb" :height="'20em'" @contentSet="setContent(content)"></plexthumb>
                </v-flex>
            </v-layout>  
            <v-layout row>
              <v-flex xs12 v-if="contents && !browsingContent && !stopNewContent" v-observe-visibility="getMoreContent" justify-center>
                Loading...
              </v-flex>  
            </v-layout>   
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'" :content="browsingContent"
                     :server="server" :library="library"></plexcontent>
        <plexseries v-if="browsingContent && browsingContent.type == 'show'" :content="browsingContent" :server="server"
                    :library="library"></plexseries>
    </span>
</template>

<script>
  import plexcontent from './plexcontent'
  import plexseries from './plexseries'  
  import plexthumb from './plexthumb'

  var _ = require('lodash');
  export default {
    props: ['library', 'server'],
    components: {
      plexcontent,
      plexseries,
      plexthumb
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
    watch: {
      browsingContent: function () {
      }
    },
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
      }

    }
  }
</script>
