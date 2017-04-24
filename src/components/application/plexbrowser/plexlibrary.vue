<template>
    <div>
        <h2 v-if="!browsingLibrary"> {{ library.title }}</h2>
        <div v-if="contents && !browsingContent" >
            <div v-for="content in contents.MediaContainer.Metadata">
                <v-card v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s3">
                    <div class="white-text" >
                        <img :src="getThumb(content)" style="width:100%"/>
                        <span style="font-size: .5vw;" class="card-title truncate">{{ content.title }}</span>
                        <div> 
                            <label v-if="content.type == 'show'"> {{ content.childCount }} seasons </label> 
                            <label v-if="content.type == 'movie'"> {{ content.year }}</label> 
                        </div>
                    </div>
                </v-card>
            </div>  
        </div>           
         <div class="col l12 center" v-if="contents && !browsingContent && !stopNewContent" v-observe-visibility="getMoreContent">
                Loading...
            </div>      
        <div v-if="!contents && !browsingContent" class="center">
            <v-progress-circular active large></v-progress-circular>
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'"  :content="browsingContent" :server="server" :library="library" ></plexcontent>
        <plexseries v-if="browsingContent && browsingContent.type == 'show'"  :content="browsingContent" :server="server" :library="library" ></plexseries>
    </div>
</template>
 
<script>
import plexcontent from './plexcontent'
import plexseries from './plexseries'
  export default {
    props: ['library','server'],
    components: {
        plexcontent,
        plexseries
    },
    created(){
        // Hit the PMS endpoing /library/sections
        var that = this
        this.getMoreContent()
    },
    data() {
      return {
          browsingContent: null,
          startingIndex: 0,
          size: 50,

          stopNewContent: false,
          busy: false,

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
            return this.server.getUrlForLibraryLoc(object.thumb)
        },
        getMoreContent(){
            if (this.stopNewContent || this.busy){
                return
            }
            console.log('We need to get more content!')
            var that = this
            this.busy = true
            this.server.getLibraryContents(this.library.key, this.startingIndex,this.size,function(result){
                console.log('Metadata result',result)
                if (result && result.MediaContainer && result.MediaContainer.Metadata){
                    that.startingIndex = that.startingIndex + 50
                    if (that.contents){
                        for (let i = 0; i < result.MediaContainer.Metadata.length; i++){
                            let media = result.MediaContainer.Metadata[i]
                            that.contents.MediaContainer.Metadata.push(media)
                        }
                    } else {
                        that.contents = result
                    }
                    if (result.MediaContainer.size < 50){
                        that.stopNewContent = true
                    }
                    
                } else {
                    that.status = 'Error loading libraries!'
                }
                that.busy = false
            })
        }

        

 
    }
  }
</script>