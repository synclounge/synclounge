<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important"> Season {{ content.index }}<span
          v-if="browsingContent"> > </span> </span>
        <div v-if="contents && !browsingContent" class="mt-3">    
          <v-card horizontal height="15em">
            <v-card-row :img="getThumb(content)" height="100%"></v-card-row>
            <v-card-column>
              <v-card-row height="11em"  class="blue-grey darken-3 white--text">
                <v-card-text>
                  <h3> {{ content.parentTitle }}</h3>
                  <h6>{{ content.title }}</h6>
                  <p> {{ contents.MediaContainer.size }} episodes </p>
                </v-card-text>
              </v-card-row>
              <v-card-row actions class="blue-grey darken-4">
                <v-btn flat class="white--text">
                  <v-chip v-if="contents.MediaContainer.grandparentContentRating" v-tooltip:top="{ html: 'Content Rating' }" label> {{ contents.MediaContainer.grandparentContentRating }}</v-chip>
                  <v-chip v-if="contents.MediaContainer.grandparentStudio" v-tooltip:top="{ html: 'Studio' }" secondary> {{ contents.MediaContainer.grandparentStudio }}</v-chip>
                </v-btn>
              </v-card-row>
            </v-card-column>
          </v-card>
          <h4 class="mt-3"> Episodes </h4>
          <v-divider></v-divider>
          <div>          
              <v-layout class="row" row wrap>
                <v-flex xs6 md3 xl1 lg2  class="pb-3" v-for="content in contents.MediaContainer.Metadata" :key="content">
                  <plexthumb :content="content" :server="server" type="thumb" :height="'10em'" @contentSet="setContent(content)"></plexthumb>
                </v-flex>
            </v-layout>  
          </div>



            <!--<div v-if="contents && !browsingContent">
                <v-card class="blue-grey darken-1 col l12 s12 hoverable" style="height:100%;box-shadow:none">
                    <div class="white-text row">
                        <img :src="getThumb(content)" style="height:100%" class="col s4 l2"/>
                        <div class="col l10 s8">
                            <h1 style="font-size: 3em;"> {{ content.parentTitle }}</h1>
                            <h2 style="font-size: 2em;" class="card-title truncate">{{ content.title }}</h2>
                            <label style="font-size: 2em;"> {{ content.leafCount }} episodes </label>
                            <p> {{ content.summary }} </p>
                        </div>
                    </div>
                </v-card>
                <div class="divider"></div>
                <h5> Episodes </h5>
                <div v-for="content in contents.MediaContainer.Metadata">
                    <v-card v-on:click.native="setContent(content)" class="blue-grey darken-1 col l2 s4 hoverable" style="box-shadow:none">
                        <div class="white-text">
                            <img :src="getThumb(content)" style="width:100%"/>
                            <span style="font-size: 1em;" class="card-title truncate">
                                {{ content.title }}
                            </span>
                            <span style="font-size: 1em;" class="card-title truncate">
                                Episode {{ content.index }}
                            </span>
                        </div>
                    </v-card>
                </div>
            </div>
            <div v-if="!contents && !browsingContent" class="center">
                <v-progress-circular active large></v-progress-circular>
            </div>-->
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'" :content="browsingContent"
                     :server="server" :library="library"></plexcontent>
    </span>
</template>

<script>
  import plexcontent from './plexcontent'
  import plexthumb from './plexthumb.vue'

  export default {
    props: ['library', 'server', 'content'],
    components: {
      plexcontent,
      plexthumb
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this
      this.server.getSeriesContent(this.content.key, 0, 500, 1, function (result) {
        if (result) {
          that.contents = result
        } else {
          that.status = 'Error loading content!'
        }
      })
    },
    data () {
      return {
        browsingContent: null,

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
        return this.server.getUrlForLibraryLoc(object.art, w / 3, h / 4)
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
