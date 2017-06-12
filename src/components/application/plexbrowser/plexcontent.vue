<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important">{{ title }}</span>
        <div v-if="!browsingContent" class="mt-3">    
          <v-card v-if="contents" horizontal height="50em">
            <v-card-row :img="getThumb(content)" height="100%"></v-card-row>
            <v-card-column>
              <v-card-row height="11em"  class="blue-grey darken-3 white--text">
                <v-card-text v-if="content.type == 'episode'">
                  <h3> {{ content.grandparentTitle }}</h3>
                  <p> Season {{ contents.parentIndex }} Episode {{ contents.index }} </p>   
                  <h6>{{ content.title }}</h6>                              
                  <p style="font-style: italic" v-if="contents.viewCount == 0 || !contents.viewCount"> Episode summary automatically hidden for unwatched episodes </p> 
                  <p style="font-style: italic" v-else> {{ content.summary }} </p>            
                  <v-divider></v-divider>
                  <div>     
                    <v-chip bottom v-tooltip:top="{ html: 'Resolution' }" class="grey darken-4 white--text" outline left> {{ largestRes }}p</v-chip> 
                    <v-chip bottom v-tooltip:top="{ html: 'Year' }" class="grey darken-4 white--text" outline left> {{ contents.year }}</v-chip>   
                    <v-chip v-if="contents.contentRating" v-tooltip:top="{ html: 'Content Rating' }" class="grey darken-4 white--text" small label> {{ contents.contentRating }}</v-chip>     
                    <v-chip v-for="genre in contents.Genre" :key="genre" v-tooltip:top="{ html: 'Genre' }" class="grey darken-4 white--text"  small label> {{ genre.tag }}</v-chip>
                  </div>
                </v-card-text>                
                <v-card-text v-if="content.type == 'movie'" >
                  <h3>{{ content.title }}</h3>
                  <h6> {{ contents.year }} </h6>   
                  <div>     
                    <v-chip bottom v-tooltip:top="{ html: 'Resolution' }" class="grey darken-4 white--text" outline left> {{ largestRes }}p</v-chip>    
                    <v-chip v-tooltip:top="{ html: 'Content Rating' }" class="grey darken-4 white--text" small label> {{ contents.contentRating }}</v-chip>                  
                    <v-chip v-tooltip:top="{ html: 'Studio' }"  class="grey darken-4 white--text" small label> {{ contents.studio }}</v-chip>
                    <v-chip v-for="genre in contents.Genre" :key="genre" v-tooltip:top="{ html: 'Genre' }" class="grey darken-4 white--text"  small label> {{ genre.tag }}</v-chip>
                  </div>
                  <p style="font-style: italic"> {{ content.summary }} </p>      
                  <v-divider></v-divider>
                  <v-subheader class="white--text"> Featuring </v-subheader>
                  <div v-for="actor in contents.Role.slice(0,3)" :key="actor">
                    {{actor.tag}} as {{actor.role}}
                  </div>
                </v-card-text>
              </v-card-row>
              <v-card-row actions class="blue-grey darken-4">    
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

  export default {
    props: ['library', 'server', 'content'],
    components: {
      plexcontent
    },
    created () {
      // Hit the PMS endpoing /library/sections
      var that = this
      console.log('Loading content metadata: ' + this.content.ratingKey)
      this.server.getMediaByRatingKey(this.content.ratingKey, function (result) {
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
      getThumb (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        if (object.type == 'movie'){          
          return this.server.getUrlForLibraryLoc(object.thumb, w / 3, h / 1)
        }
        return this.server.getUrlForLibraryLoc(object.grandparentThumb, w / 3, h / 1)
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
