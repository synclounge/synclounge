<template>
    <span ref="root">
        <span v-if="playable" v-on:click="reset()" style="cursor: pointer !important">{{ title }}</span>
        <v-layout v-if="!contents && !browsingContent" row >
          <v-flex xs12 style="position:relative">
              <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
          </v-flex>
        </v-layout>
        <div v-if="!browsingContent">    

          <v-flex xs12 class="mt-3">
            <v-card v-if="contents" horizontal :img="getArtUrl" class="darken-2 white--text">
              <v-container style="background: rgba(0, 0, 0, .4);"  class="pa-0 ma-0" fluid grid-list-lg>
                <v-layout row style="height:100%">
                  <v-flex md4 class="hidden-sm-and-down">
                    <v-card-media
                      :src="getThumb()"
                      height="50em"
                      contain
                    ></v-card-media>
                  </v-flex>


                  <v-flex md8 sm12 style="position:relative" v-if="content.type == 'episode'">
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
                    <p class="pt-3" style="font-style: italic" v-if="hidden" v-on:click="hidden = false"> Episode summary automatically hidden for unwatched episodes. Click to unhide.</p> 
                    <p class="pt-3" style="font-style: italic" v-else> {{ content.summary }} </p>                  
                  </v-flex>   



                  <v-flex md9 sm12 style="position:relative" v-if="content.type == 'movie'">
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
                        <div v-for="actor in contents.Role.slice(0,6)" :key="actor.tag">
                          {{actor.tag}} <span style="opacity:0.7;font-size:80%"> {{actor.role}} </span>
                        </div>
                      </v-flex>                      
                      <v-flex lg3 xl2 v-if="contents.Director && contents.Director.length > 0">                      
                        <v-subheader class="white--text"> Director </v-subheader>
                        <div v-for="director in contents.Director.slice(0,3)" :key="director.tag">
                          {{director.tag}}
                        </div>
                      </v-flex>                    
                      <v-flex lg3 xl2 v-if="contents.Producer && contents.Producer.length > 0">                      
                        <v-subheader class="white--text"> Producers </v-subheader>
                        <div v-for="producer in contents.Producer.slice(0,3)" :key="producer.tag">
                          {{producer.tag}}
                        </div>
                      </v-flex>                     
                      <v-flex lg3 xl2 v-if="contents.Writer && contents.Writer.length > 0">                      
                        <v-subheader class="white--text"> Writers </v-subheader>
                        <div v-for="writer in contents.Writer.slice(0,3)" :key="writer.tag">
                          {{writer.tag}}
                        </div>
                      </v-flex>      
                    </v-layout>              
                  </v-flex>                     
                  
                  <v-flex md9 sm12 style="position:relative" v-if="content.type == 'track'">
                    <h3> {{ content.grandparentTitle }}</h3>
                    <h6> {{ content.parentTitle }}</h6>
                    <h3> {{ content.title }}</h3>
                    <v-layout row wrap align-end>                       
                      <v-flex xs12 sm6  style="opacity:0.5">                      
                        {{ length }}
                      </v-flex>               
                      <v-flex xs12 sm6 style="position:relative">     
                        <div style="float:right">    
                          <v-chip v-if="contents.year"  v-tooltip:top="{ html: 'Content Rating' }" class="grey darken-4 white--text" small label> {{ contents.year }}</v-chip>                  
                          <v-chip v-for="copy in contents.Media" :key="copy.key" v-tooltip:top="{ html: 'Quality' }"  class="grey darken-4 white--text" small> {{ copy.audioCodec.toUpperCase() }}</v-chip>              
                        </div>
                      </v-flex>  
                    </v-layout>  
                    <v-divider></v-divider>     
                    <v-chip v-for="country in contents.Country" :key="country.tag" v-tooltip:top="{ html: 'Country' }"> {{ country.tag }}</v-chip>
                    <v-chip v-for="genre in contents.Genre" :key="genre.tag" v-tooltip:top="{ html: 'Genre' }"> {{ genre.tag }}</v-chip>      
                  </v-flex>  
                  <div class="pa-4" style="position:absolute; bottom: 0; right: 0">    
                    <v-btn v-if="playable && content.Media.length != 1" @click.native.stop="dialog = true"  class="primary white--text">
                     <v-icon>play_arrow</v-icon> Play Version   
                    </v-btn>                 
                    <v-btn v-if="playable && content.Media.length == 1 && (content.viewOffset == 0 || !content.viewOffset)"  v-on:click.native="playMedia(content)" class="primary white--text">
                      <v-icon>play_arrow</v-icon> Play
                    </v-btn>             
                    <span v-if="!playable" class="pa-2" >Now playing on {{ chosenClient.name }} from {{ server.name }}</span>
                    <v-btn v-if="!playable" style="background-color: #cc3f3f" v-on:click.native="pressStop()" class="white--text">
                      <v-icon></v-icon> Stop 
                    </v-btn>
                  </div>  
                </v-layout>                
              </v-container>                
            </v-card>
          </v-flex>
        </div>
        <v-dialog v-if="contents" v-model="dialog" class="pa-0 ma-0" width="500px">
          <v-card style="background:rgba(0,0,0,0.4)">
            <v-card-title class="headline">Select Version</v-card-title>
            <v-checkbox v-bind:label="'Resume from ' + getDuration(contents.viewOffset) " color="orange lighten-2" class="pa-0 ma-0 ml-3" v-model="resumeFrom"></v-checkbox>
            <div v-for="(media,index) in contents.Media" :key="media.Part[0].key">
              <v-layout row wrap>
                <v-flex xs8>    
                  <div class="pl-2">{{ media.videoResolution }}p {{ getDuration(media.duration)}}</div>
                  <div class="pl-4 soft-text" > 
                    <div>Video Codec: {{ media.videoCodec }} ({{ media.bitrate }}kbps) </div> 
                    <div>
                      Audio Streams: {{ audioStreams(media.Part[0].Stream) }}
                    </div>
                    <div>
                      Subtitles: {{ subtitleStreams(media.Part[0].Stream) }}
                    </div>
                  </div>
                </v-flex>                
                <v-flex xs4>                  
                  <v-btn class="primary white--text" @click.native.stop="playMedia(content,index)">
                    Play
                  </v-btn>
                </v-flex>
              </v-layout>
            </div>  
          </v-card>
        </v-dialog>
    </span>
</template>

<script>
  import plexcontent from './plexcontent.vue'
  var humanizeDuration = require('humanize-duration')

  export default {
    props: ['library', 'server', 'content', 'nowPlaying', 'height'],
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

        hidden: false,
        fullheight: null,
        fullwidth: null,
        resumeFrom: true,

        contents: null,
        status: "loading..",
        dialog:false,

        eventbus: window.eventbus
      }
    },
    mounted () {
      if (this.content.viewCount == 0 || !this.content.viewCount){
        this.hidden = true
      }
      this.fullheight = this.$refs.root.offsetHeight
      this.fullwidth = this.$refs.root.offsetWidth  
    },
    beforeDestroy () {

    },
    computed: {
      largestRes () {
        let height = 0
        for (let i = 0; i < this.content.Media.length; i++) {
          if (parseInt(this.content.Media[i].videoResolution) > height) {
            height = parseInt(this.content.Media[i].videoResolution)
          }
        }
        return height
      },      
      calculatedHeight (){
        if (this.height){
          return this.height + 'em'
        }
        if (this.content.type == 'movie'){
          return Math.round(this.fullwidth * 2) + 'px'
        }        
        if (this.content.type == 'episode'){
          return Math.round(this.fullwidth * 2) + 'px'
        }
        return Math.round(this.fullwidth * 2) + 'px'
      },
      chosenClient () {
        return this.$store.getters.getChosenClient
      },
      plex () {
        return this.$store.getters.getPlex
      }, 
      playable () {
        if (this.nowPlaying || this.nowPlaying == '') {
          return false
        }
        return true
      },
      getArtUrl () {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        if (this.content.type == 'movie'){          
          return this.server.getUrlForLibraryLoc(this.contents.art, w / 3, h / 1, 5)
        }        
        if (this.content.type == 'track'){          
          return this.server.getUrlForLibraryLoc(this.contents.grandparentArt, w / 3, h / 1, 5)
        }
        return this.server.getUrlForLibraryLoc(this.contents.thumb, w / 3, h / 1, 5)
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
          return this.server.getUrlForLibraryLoc(this.contents.thumb, w / 1, h / 1)
        }
        return this.server.getUrlForLibraryLoc(this.contents.parentThumb, w / 1, h / 1)
      },
      playMedia (content, mediaIndex) {
        var callback = function(result){
          console.log(result)
        }
        let offset = 0
        if (this.resumeFrom){
          offset = this.contents.viewOffset
        }

        this.chosenClient.playMedia({
            ratingKey: this.contents.ratingKey,
            mediaIndex: mediaIndex,
            server: this.server,
            offset: offset,
            callback: callback
          }
        )
        


      },
      getDuration (dur){
        return humanizeDuration(dur, { 
          delimiter: ' ', 
          units: ['h', 'm', 's'],
          round: true 
        })
      },
      pressStop () {
        this.chosenClient.pressStop( function (result) {
          console.log('Stop result: ' + result)
        })
      },
      getStreamCount (streams,type) {
        let count = 0
        streams.forEach((stream) => {
          if (stream.streamType == type){
            count++
          }
        })
        return count
      },
      audioStreams (media) {        
        let result = ''
        for (let i = 0; i < media.length; i++){
          let stream = media[i]
          if (stream.streamType == 2){
            result = result + ' ' + stream.languageCode + ','
          }
        }
        result = result.substring(0, result.length-1);
        return result
      },
      subtitleStreams (media) {
        let result = ''
        for (let i = 0; i < media.length; i++){
          let stream = media[i]
          if (stream.streamType == 3){
            result = result + ' ' + stream.languageCode + ','
          }
        }
        result = result.substring(0, result.length-1);
        return result
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
