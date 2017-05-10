<template>
    <div>
        <div v-if="contents && !browsingContent">                
            <v-card class="blue-grey darken-1 col l12 s12" style="height:100%;box-shadow:none">
                <div class="white-text row">
                    <img :src="getThumb(content)" style="height:100%" class="col s6 l2"/>
                    <div class="col l10 s6">
                        <h2 class="card-title truncate">{{ content.title }}</h2>
                        <label> {{ content.leafCount }} episodes since {{ content.year }} </label>
                        <p> {{ content.summary }} </p>
                    </div>
                </div>
            </v-card>
            <h2> Seasons </h2>
            <div v-for="content in contents.MediaContainer.Metadata">
                <v-card v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none">
                    <div class="white-text">
                        <img :src="getThumb(content)" style="width:100%"/>
                        <span style="font-size: .5vw;" class="card-title truncate">{{ content.title }}</span>
                        <div> 
                            <label> {{ content.leafCount }} episodes </label> 
                        </div>
                    </div>
                </v-card>
            </div>            
        </div>
        <div v-if="!contents && !browsingContent" class="center">
            <v-progress-circular active large></v-progress-circular>
        </div>
        <plexseason v-if="browsingContent" :content="browsingContent" :server="server" :library="library" ></plexseason>
    </div>
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
        }

        

 
    }
  }
</script>