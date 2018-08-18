<template>
  <span style="max-height: 90%">
    <v-layout v-if="!contents && !browsingContent" row justify-center align-center>
      <v-flex xs12 style="position:relative">
        <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
      </v-flex>
    </v-layout>
    <div v-if="!browsingContent && contents" class="mt-3" style="height:90vh; overflow-y: auto">
      <v-layout class="row" row wrap align-center justify-start>
        <v-flex xs3 sm3 md1 lg1  class="ma-1"  v-for="content in contents.MediaContainer.Metadata" :key="content.key">
          <plexthumb :content="content" :server="server" type="thumb" style="margin:7%" @contentSet="setContent(content)"></plexthumb>
        </v-flex>
      </v-layout>
      <v-layout row>
        <v-flex xs12 v-if="contents && !browsingContent && !stopNewContent" v-observe-visibility="getMoreContent" justify-center>
          Loading...
        </v-flex>
      </v-layout>
    </div>
  </span>
</template>

<script>
import plexcontent from './plexcontent'
import plexseries from './plexseries'
import plexalbum from './plexalbum'
import plexthumb from './plexthumb'
import plexartist from './plexartist'

var _ = require('lodash')
export default {
  props: ['library'],
  components: {
    plexcontent,
    plexseries,
    plexthumb,
    plexalbum,
    plexartist
  },
  created () {
    // Hit the PMS endpoing /library/sections
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
      status: 'loading..',
      searchPhrase: null
    }
  },
  mounted () {
  },
  beforeDestroy () {

  },
  computed: {
    server: function () {
      return this.plex.servers[this.$route.params.machineIdentifier]
    }
  },
  methods: {
    setContent (content) {
      this.browsingContent = content
    },
    handler (component) {
    },
    getThumb (object) {
      var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0))
      var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0))
      return this.server.getUrlForLibraryLoc(object.thumb, w / 6, h / 4)
    },
    setBackground () {
      var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0))
      var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0))

      let randomItem = _.sample(this.contents.MediaContainer.Metadata)
      let url = randomItem.thumb
      if (randomItem.type === 'show') {
        url = randomItem.art
      }
      this.$store.commit('SET_BACKGROUND', this.server.getUrlForLibraryLoc(url, w / 4, h / 4, 8))
    },
    isShown (item) {
      if (!item.active) {
        return {
          display: 'none'
        }
      }
      return {}
    },
    getTitleMovie (movie) {
      if (movie.year) {
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
      this.busy = true
      this.server.getLibraryContents(this.$route.params.sectionId, this.startingIndex, this.size).then((result) => {
        if (result && result.MediaContainer && result.MediaContainer.Metadata) {
          this.libraryTotalSize = result.MediaContainer.totalSize
          this.startingIndex = this.startingIndex + 100
          if (this.contents) {
            for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
              let media = result.MediaContainer.Metadata[i]
              media.active = true
              this.contents.MediaContainer.Metadata.push(media)
            }
          } else {
            for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
              let media = result.MediaContainer.Metadata[i]
              media.active = true
            }
            this.contents = result
            this.setBackground()
          }
          if (result.MediaContainer.size < 100) {
            this.stopNewContent = true
          }
        } else {
          this.status = 'Error loading libraries!'
        }
        this.busy = false
      })
    },
    reset () {
      this.browsingContent = false
      this.setBackground()
    }

  }
}
</script>
