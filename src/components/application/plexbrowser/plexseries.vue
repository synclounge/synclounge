<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important"> {{ content.title }} <span v-if="browsingContent"> > </span></span>
        <v-layout v-if="!contents && !browsingContent" row>
          <v-flex xs12 style="position:relative">
              <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
          </v-flex>
        </v-layout>
        <div v-if="contents && !browsingContent" class="mt-3">          
          <v-card horizontal height="25em" :img="getArtUrl">
            <v-card-row class="hidden-sm-and-down" :img="getThumb(content)" height="100%"></v-card-row>
            <v-card-column style="background: rgba(0, 0, 0, .4)">
              <v-card-row height="11em"  class="white--text">
                <v-card-text>
                  <h3> {{ content.parentTitle }}</h3>
                  <h3>{{ content.title }}</h3>
                  <p> {{ getSeasons }} </p>         
                  <v-divider></v-divider>         
                  <p style="font-style: italic" class="pt-3"> {{ content.summary }} </p>      
                </v-card-text>
              </v-card-row>
              <v-card-row actions>
                <v-chip v-if="contents.MediaContainer.parentYear" v-tooltip:top="{ html: 'Year' }" label> {{ contents.MediaContainer.parentYear }}</v-chip>
              </v-card-row>
            </v-card-column>
          </v-card>
          <h4 class="mt-3"> Episodes </h4>
            <v-layout class="row" row wrap>
                <v-flex xs4 md3 xl1 lg1  class="pb-3" v-for="content in contents.MediaContainer.Metadata" :key="content">
                  <plexthumb :content="content" :server="server" type="thumb" @contentSet="setContent(content)"></plexthumb>
                </v-flex>
            </v-layout>  
        </div>
        <plexseason v-if="browsingContent" :content="browsingContent" :server="server" :library="library"></plexseason>
    </span>
</template>

<script>
  import plexseason from './plexseason.vue'
  import plexthumb from './plexthumb.vue'

  export default {
    props: ['library', 'server', 'content'],
    components: {
      plexseason,
      plexthumb
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this
      this.server.getSeriesContent(this.content.key, this.startingIndex, this.size, 1, (result) => {
        if (result) {
          this.contents = result
          this.setBackground()
        } else {
          this.status = 'Error loading libraries!'
        }
      })
    },
    data () {
      return {
        browsingContent: null,
        startingIndex: 0,
        size: 150,

        contents: null,
        status: "loading..",
      }
    },
    mounted () {

    },
    beforeDestroy () {

    },
    computed: {
      getArtUrl (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(this.contents.MediaContainer.banner, w / 1, h / 1, 10)
      },
      getSeasons () {
        if (this.contents.MediaContainer.size == 1){
          return this.contents.MediaContainer.size + ' season'
        }
        return this.contents.MediaContainer.size + ' seasons'
      }
    },
    methods: {
      setContent (content) {
        this.browsingContent = content
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.thumb, w / 3, h / 4)
      },
      setBackground () {        
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        this.$store.commit('SET_BACKGROUND',this.server.getUrlForLibraryLoc(this.content.art, w / 4, h / 4, 8))
      },
      reset () {
        this.browsingContent = false
        this.setBackground()
      }

    }
  }
</script>
