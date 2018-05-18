<template>
    <span>
      <span v-on:click="reset()" style="cursor: pointer !important"> {{ content.title }}<span
          v-if="browsingContent"> > </span> </span>
      <v-layout v-if="!contents && !browsingContent" row>
        <v-flex xs12 style="position:relative">
          <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
        </v-flex>
      </v-layout>
      <div v-if="contents && !browsingContent" class="mt-3">
        <v-card horizontal height="25em" :img="getArtUrl">
          <v-card-row class="hidden-sm-and-down" :img="getThumb" height="100%"></v-card-row>
          <v-card-column style="background: rgba(0, 0, 0, .4)">
            <v-card-row height="11em"  class="white--text">
              <v-card-text>
                <h3> {{ content.title }}</h3>
                <p> {{ contents.MediaContainer.summary }} </p>
              </v-card-text>
            </v-card-row>
            <v-card-row actions>
              <v-chip v-for="genre in content.Genre" :key="genre" v-tooltip:top="{ html: 'Genre' }" label> {{ genre.tag }}</v-chip>
              <v-chip v-for="country in content.Country" :key="country" v-tooltip:top="{ html: 'Country' }"> {{ country.tag }}</v-chip>
            </v-card-row>
          </v-card-column>
        </v-card>
        <h4 class="mt-3"> Albums </h4>
        <v-divider></v-divider>
        <div>
          <v-layout class="row mt-3" row wrap>
            <v-flex xs6 md3 xl1 lg2  class="pb-3" v-for="content in contents.MediaContainer.Metadata" :key="content">
              <plexthumb :content="content" :server="server" type="thumb" fullTitle @contentSet="setContent(content)"></plexthumb>
            </v-flex>
          </v-layout>
        </div>
      </div>
      <plexalbum v-if="browsingContent && browsingContent.type == 'album'" :content="browsingContent" :server="server" :library="library"></plexalbum>
      <plexcontent v-if="browsingContent && browsingContent.type != 'album'" :content="browsingContent" :server="server" :library="library"></plexcontent>
    </span>
</template>

<script>
import plexcontent from './plexcontent'
import plexalbum from './plexalbum'
import plexthumb from './plexthumb.vue'

export default {
  props: ['library', 'server', 'content'],
  components: {
    plexcontent,
    plexthumb,
    plexalbum
  },
  created () {
    // Hit the PMS endpoing /library/sections
    this.server.getSeriesContent(this.content.key, 0, 500, 1, result => {
      if (result) {
        this.contents = result
        this.setBackground()
      } else {
        this.status = 'Error loading content!'
      }
    })
  },
  data () {
    return {
      browsingContent: null,

      contents: null,
      status: 'loading..'
    }
  },
  watch: {
    browsingContent: function () {
      if (!this.browsingContent) {
        this.$store.commit('SET_BACKGROUND', null)
      }
    }
  },
  mounted () {},
  beforeDestroy () {},
  computed: {
    getArtUrl () {
      var w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      )
      var h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      )
      return this.server.getUrlForLibraryLoc(
        this.contents.MediaContainer.banner,
        w / 2,
        h / 1,
        5
      )
    },
    getThumb () {
      var w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      )
      var h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      )
      return this.server.getUrlForLibraryLoc(
        this.contents.MediaContainer.thumb,
        w / 1,
        h / 2
      )
    }
  },
  methods: {
    setContent (content) {
      this.browsingContent = content
    },
    setBackground () {
      var w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      )
      var h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      )

      this.$store.commit(
        'SET_BACKGROUND',
        this.server.getUrlForLibraryLoc(
          this.contents.MediaContainer.art,
          w / 4,
          h / 4,
          8
        )
      )
    },
    reset () {
      this.browsingContent = false
      this.setBackground()
    }
  }
}
</script>
