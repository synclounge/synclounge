<template>
    <span> 
        <span v-on:click="reset()"> {{ content.title }} <span v-if="browsingContent"> > </span></span>
        <div v-if="!browsingContent">
            <div v-if="contents && !browsingContent">                
                <v-card class="blue-grey darken-1 col l12 s12" style="box-shadow:none">
                    <div class="white-text row">
                        <img :src="getArt(content)" style="height:100%" class="col s12 l4"/>
                        <div class="col l8 s12">
                            <h2 class="card-title">{{ content.title }}</h2>
                            <label> {{ content.leafCount }} episodes since {{ content.year }} - </label>
                            <label> {{ content.sourceTitle }}</label>
                            <p> {{ content.summary }} </p>
                        </div>
                    </div>
                </v-card>            
                <div class="divider"></div>
                <h2> Seasons </h2>
                <div v-for="content in contents.MediaContainer.Metadata">
                    <v-card v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s6 hoverable" style="box-shadow:none">
                        <div class="white-text">
                            <img :src="getThumb(content)" style="width:100%"/>
                            <span style="font-size: 1.3vh;" class="card-title">{{ content.title }}</span>
                            <div> 
                                <label style="font-size: 1vh;"> {{ content.leafCount }} episodes </label> 
                            </div>
                        </div>
                    </v-card>
                </div>            
            </div>
            <div v-if="!contents && !browsingContent" class="center">
                <v-progress-circular active large></v-progress-circular>
            </div>
        </div>
        <plexseason v-if="browsingContent" :content="browsingContent" :server="server" :library="library" ></plexseason>
    </span>
</template>
 
<script>
import plexseason from './plexseason.vue'
  export default {
    props: ['library','server', 'content'],
    components: {
        plexseason
    },
    created(){
        // Hit the PMS endpoing /library/sections
        var that = this
        this.server.getSeriesContent(this.content.key, this.startingIndex, this.size, 1, function(result){
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
          startingIndex: 0,
          size: 150,

          contents: null,
          status: "loading..",
      }
    },
    mounted() {                    
        



    },
    beforeDestroy(){
        
    },
    computed: {
      
    },
    methods: {
        setContent(content){
            this.browsingContent = content
        },
        getThumb(object){
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.thumb,w/12, h/4)
        },
        getArt(object){
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.art,w/3, h/2)
        },
        reset(){
            this.browsingContent = false
        }

        

 
    }
  }
</script>