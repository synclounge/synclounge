<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important"> {{ content.title }} <span v-if="browsingContent"> > </span></span>
        <div v-if="contents && !browsingContent" class="mt-3">
            <v-layout class="row" row wrap>
                <v-flex xs6 md3 xl1 lg2  class="pb-3" v-for="content in contents.MediaContainer.Metadata" :key="content">
                  <plexthumb :content="content" :server="server" type="thumb" :height="'20em'" @contentSet="setContent(content)"></plexthumb>
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
      this.server.getSeriesContent(this.content.key, this.startingIndex, this.size, 1, function (result) {
        if (result) {
          that.contents = result
        } else {
          that.status = 'Error loading libraries!'
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
    computed: {},
    methods: {
      setContent (content) {
        this.browsingContent = content
      },
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.thumb, w / 3, h / 4)
      },
      getArt (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        return this.server.getUrlForLibraryLoc(object.art, w / 3, h / 2)
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
