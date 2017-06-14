<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important">{{ title }}</span>
        <v-layout v-if="!contents && !browsingContent" row>
          <v-flex xs12 style="position:relative">
              <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
          </v-flex>
        </v-layout>
        <div v-if="!browsingContent" class="mt-3">    
          <v-card v-if="contents" horizontal height="50em" :img="getArtUrl" >
            <v-card-row class="hidden-sm-and-down" :img="getThumb(content)" height="100%"></v-card-row>
            <v-card-column style="background: rgba(0, 0, 0, .4)">
              <v-card-row height="11em"  class="white--text">
                <v-card-text v-if="content.type == 'episode'">
                  <h3> {{ content.grandparentTitle }}</h3>
                  <p> Season {{ contents.parentIndex }} Episode {{ contents.index }} </p> 
                  <h6>{{ content.title }}</h6>   
                  <v-layout row wrap align-end>
                    <v-flex xs12 sm6 style="opacity:0.5">                      
                      {{ length }}
                    </v-flex>                      
                    <v-flex xs12 sm6 style="position:relative">     
                      <div style="float:right">                 
                        <v-chip bottom v-tooltip:top="{ html: 'Resolution' }" class="grey darken-1 white--text" outline left> {{ largestRes }}p</v-chip> 
                        <v-chip bottom v-tooltip:top="{ html: 'Year' }" class="grey darken-4 white--text" outline left> {{ contents.year }}</v-chip>   
                        <v-chip v-if="contents.contentRating" v-tooltip:top="{ html: 'Content Rating' }" class="grey darken-4 white--text" small label> {{ contents.contentRating }}</v-chip>     
                      </div>
                    </v-flex>  
                  </v-layout>   
                  <v-divider></v-divider>             
                  <p class="pt-3" style="font-style: italic" v-if="contents.viewCount == 0 || !contents.viewCount"> Episode summary automatically hidden for unwatched episodes </p> 
                  <p class="pt-3" style="font-style: italic" v-else> {{ content.summary }} </p>    
                </v-card-text>                
                <v-card-text v-if="content.type == 'movie'" >
                  <h3>{{ content.title }}</h3>
                  <h4> {{ contents.year }} </h4>   
                  <v-layout row wrap align-end>
                    <v-flex xs12 sm6  style="opacity:0.5">                      
                      {{ length }}
                    </v-flex>                      
                    <v-flex xs12 sm6 style="position:relative">     
                      <div style="float:right">                 
                        <v-chip bottom v-tooltip:top="{ html: 'Resolution' }" class="grey darken-1 white--text" outline left> {{ largestRes }}p</v-chip>    
                        <v-chip v-if="contents.contentRating" v-tooltip:top="{ html: 'Content Rating' }" class="grey darken-4 white--text" small label> {{ contents.contentRating }}</v-chip>                  
                        <v-chip v-if="contents.studio" v-tooltip:top="{ html: 'Studio' }"  class="grey darken-4 white--text" small label> {{ contents.studio }}</v-chip>
                      </div>
                    </v-flex>  
                  </v-layout>   
                  <v-divider></v-divider>
                  <p class="pt-3" style="font-style: italic"> {{ content.summary }} </p>                     
                  <v-layout row wrap class="hidden-sm-and-down">
                    <v-flex lg3 xl2 v-if="contents.Role && contents.Role.length > 0">                      
                      <v-subheader class="white--text"> Featuring </v-subheader>
                      <div v-for="actor in contents.Role.slice(0,6)" :key="actor">
                        {{actor.tag}} <span style="opacity:0.7;font-size:80%"> {{actor.role}} </span>
                      </div>
                    </v-flex>                      
                    <v-flex lg3 xl2 v-if="contents.Director && contents.Director.length > 0">                      
                      <v-subheader class="white--text"> Director </v-subheader>
                      <div v-for="director in contents.Director.slice(0,3)" :key="director">
                        {{director.tag}}
                      </div>
                    </v-flex>                    
                    <v-flex lg3 xl2 v-if="contents.Producer && contents.Producer.length > 0">                      
                      <v-subheader class="white--text"> Producers </v-subheader>
                      <div v-for="producer in contents.Producer.slice(0,3)" :key="producer">
                        {{producer.tag}}
                      </div>
                    </v-flex>                     
                    <v-flex lg3 xl2 v-if="contents.Writer && contents.Writer.length > 0">                      
                      <v-subheader class="white--text"> Writers </v-subheader>
                      <div v-for="writer in contents.Writer.slice(0,3)" :key="writer">
                        {{writer.tag}}
                      </div>
                    </v-flex>      
                  </v-layout>
                </v-card-text>
              </v-card-row>
              <v-card-row actions class="pa-4">    
                <v-btn style="width:15%" v-on:click.native="playMedia(content)" raised large class="primary white--text">
                  <v-icon light>play_arrow</v-icon> Play 
                </v-btn>
              </v-card-row>
            </v-card-column>
          </v-card>
        </div>
    </span>
</template>

<script>
  import plexcontent from './plexcontent.vue'
  var humanizeDuration = require('humanize-duration')

  export default {
    props: ['library', 'server', 'content'],
    components: {
      plexcontent
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this
      console.log('Loading content metadata: ' + this.content.ratingKey)
      this.server.getMediaByRatingKey(this.content.ratingKey, (result) => {
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

        contents: null,
        status: "loading..",

        eventbus: window.eventbus
      }
    },
    mounted () {

    },
    beforeDestroy () {

    },
    computed: {
      largestRes () {
        let height = 0
        for (let i = 0; i < this.content.Media.length; i++) {
          if (this.content.Media[i].height > height) {
            height = this.content.Media[i].height
          }
        }
        return height
      },
      chosenClient () {
        return this.$store.getters.getChosenClient
      },
      plex () {
        return this.$store.getters.getPlex
      }, 
      getArtUrl () {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        if (this.content.type == 'movie'){          
          return this.server.getUrlForLibraryLoc(this.contents.art, w / 3, h / 1, 10)
        }
        return this.server.getUrlForLibraryLoc(this.contents.thumb, w / 3, h / 1, 10)
      },
      length () {
        return humanizeDuration(this.contents.duration, { 
          delimiter: ' ', 
          units: ['h', 'm'],
          round: true 
        })
      },
      title () {
        if (this.content.type == 'episode') {
          return 'Episode ' + this.content.index
        }
        return this.content.title
      }
    },
    methods: {
      setContent (content) {
        this.browsingContent = content
      },
      setBackground () {        
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        this.$store.commit('SET_BACKGROUND',this.server.getUrlForLibraryLoc(this.contents.art, w / 4, h / 4, 8))
      },
      getThumb () {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        if (this.contents.type == 'movie'){          
          return this.server.getUrlForLibraryLoc(this.contents.thumb, w / 3, h / 1)
        }
        return this.server.getUrlForLibraryLoc(this.contents.parentThumb, w / 3, h / 1)
      },
      playMedia (content) {
        this.chosenClient.playMedia(this.contents.ratingKey, this.server, function (result) {
          console.log('Auto play result: ' + result)
        })
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
