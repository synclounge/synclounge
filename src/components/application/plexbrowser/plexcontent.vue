<template>
    <span>
        <span v-on:click="reset()">{{ title }}</span>
        <div v-if="!browsingContent">
            <div v-if="contents && !browsingContent">                
                <v-card class="blue-grey darken-1 col l12 s12" style="height:100%;box-shadow:none">
                    <div class="white-text row">
                        <img :src="getThumb(content)" style="height:100%" class="col s12 l3"/>
                        <div class="col l9 s12">
                            <div v-if="content.type == 'episode'">
                                <div style="font-size: 3vh;"> {{ content.grandparentTitle }} </div>                         
                                <label style="font-size: 2vh"> Season {{ content.parentIndex }} Episode {{ content.index }} </label>
                                <div style="font-size: 2vh; font-style:italic">{{ content.title }}</div>    
                                <p style="font-size: 1.5vh"> {{ content.summary }} </p>
                            </div>
                            <div v-if="content.type == 'movie'">
                                <div style="font-size: 3vh">{{ content.title }}</div>
                                <div style="font-size: 2vh"> {{ content.year }} </div>   
                                <div style="font-size: 1vh"> {{ content.sourceTitle }} </div>           
                                <p style="font-size: 1.5vh"> {{ content.summary }} </p>
                            </div>     
                            <div class="col l2 s12">       
                                <button v-on:click="playMedia(content)" id="play" style="background-color: #E5A00D;width:100%" class="waves-effect waves-light btn">Play</button>
                                <label for="play"> {{ largestRes }}p </label>   
                            </div>         
                        </div>                    
                    </div>                
                </v-card>       
            </div>
            <div v-if="!contents && !browsingContent" class="center">
                <v-progress-circular active large></v-progress-circular>
            </div>
        </div>
    </span>
</template>
 
<script>
import plexcontent from './plexcontent.vue'
  export default {
    props: ['library','server', 'content'],
    components: {
        plexcontent
    },
    created(){
        // Hit the PMS endpoing /library/sections
        var that = this
        console.log('Loading content metadata: ' + this.content.ratingKey)
        this.server.getMediaByRatingKey(this.content.ratingKey, function(result){
            if (result){
                that.contents = result
            } else {
                that.status = 'Error loading libraries!'
            }
        })
    },
    data() {
      return {
          browsingContent: null,

          contents: null,
          status: "loading..",

          eventbus: window.eventbus
      }
    },
    mounted() {                    
        



    },
    beforeDestroy(){
        
    },
    computed: {
      largestRes(){
          let height = 0
          for (let i = 0; i < this.content.Media.length; i++){
              if (this.content.Media[i].height > height){
                  height = this.content.Media[i].height
              }
          }
          return height
      },
      chosenClient(){
          return this.$store.getters.getChosenClient
      },
      plex(){
          return this.$store.getters.getPlex
      },
      title(){
          if (this.content.type == 'episode'){
              return 'Episode ' + this.content.index
          } 
          return this.content.title
      }
    },
    methods: {
        setContent(content){
            this.browsingContent = content
        },
        getThumb(object){
            console.log('Getting url for thumb ' + object.thumb)
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.thumb,w/3, h/1)
        },
        playMedia(content){
            console.log('Attempting to play')
            this.chosenClient.playMedia(this.content.ratingKey,this.server, function(result){
                console.log('Auto play result: ' + result)
            })
        },
        reset(){
            this.browsingContent = false
        }

        

 
    }
  }
</script>