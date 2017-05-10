<template>
    <div>
        <div v-if="contents && !browsingContent">            
            <v-card class="blue-grey darken-1 col l12 s12 hoverable" style="height:100%;box-shadow:none">
                <div class="white-text row">
                    <img :src="getThumb(content)" style="height:100%" class="col s6 l2"/>
                    <div class="col l10 s6">
                        <h1> {{ content.parentTitle }}</h1>
                        <h2 class="card-title truncate">{{ content.title }}</h2>
                        <label> {{ content.leafCount }} episodes </label>
                        <p> {{ content.summary }} </p>
                    </div>
                </div>
            </v-card>
            <h2> Episodes </h2>
            <div v-for="content in contents.MediaContainer.Metadata">
                <v-card v-on:click.native="setContent(content)" class="blue-grey darken-1 col l2 s6 hoverable" style="box-shadow:none">
                    <div class="white-text">
                        <img :src="getThumb(content)" style="width:100%"/>
                        <span style="font-size: .5vw;" class="card-title truncate">                        
                            {{ content.title }} 
                        </span>                        
                        <span style="font-size: .4vw;" class="card-title truncate">                        
                            Episode {{ content.index }} 
                        </span>
                    </div>
                </v-card>
            </div>            
        </div>
        <div v-if="!contents && !browsingContent" class="center">
            <v-progress-circular active large></v-progress-circular>
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'"  :content="browsingContent" :server="server" :library="library" ></plexcontent>
    </div>
</template>
 
<script>
import plexcontent from './plexcontent'
  export default {
    props: ['library','server', 'content'],
    components: {
        plexcontent,
    },
    created(){
        // Hit the PMS endpoing /library/sections
        var that = this
        this.server.getSeriesContent(this.content.key,0,500,1,function(result){
            if (result){
                that.contents = result
            } else {
                that.status = 'Error loading content!'
            }
        })
    },
    data() {
      return {
          browsingContent: null,

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
            console.log('Getting url for thumb ' + object.thumb)
            return this.server.getUrlForLibraryLoc(object.thumb)
        }

        

 
    }
  }
</script>