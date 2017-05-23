<template>
    <span >
        <span v-on:click="reset()"> {{ library.title }} <span v-if="browsingContent"> > </span></span>   
        <div v-if="!browsingContent" >
            <div v-if="!browsingLibrary" class="row">          
                <div v-if="!browsingContent" class="input-field col l2 offset-l10 valign">
                    <input  v-model="searchPhrase" id="search" type="text">      
                    <label for="search">Search</label>
                </div>
            </div>
            <div v-if="contents && !browsingContent" class="row" style="height:100%;overflow-y:auto">
                <v-card v-for="content in contents.MediaContainer.Metadata" :style="isShown(content)" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s4 hoverable" style="padding:0.5%;box-shadow:none;height:15vh">
                    <div class="row" style="margin:0">
                        <div class="col s12 ">
                            <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                        </div>
                        <div class="col s12">
                            <div style="padding:3%; padding-left:1%; height:25%;">
                                <span style="font-size: 1.2vh; vmin: 2vh" class="card-title truncate">{{ content.title }}</span>
                                <div> 
                                    <label v-if="content.type == 'show'" style="font-size: 1.2vh; vmin: 2vh"> {{ content.childCount }} seasons </label> 
                                    <label v-if="content.type == 'movie'" style="font-size: 1.2vh; vmin: 2vh"> {{ content.year }}</label> 
                                </div>
                            </div>
                        </div>
                    </div>
                </v-card>
            </div>           
            <div class="col l12 center" v-if="contents && !browsingContent && !stopNewContent">
                Loading...
            </div>      
            <div v-if="!contents && !browsingContent" class="center">
                <v-progress-circular active large></v-progress-circular>
            </div>
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'"  :content="browsingContent" :server="server" :library="library" ></plexcontent>
        <plexseries v-if="browsingContent && browsingContent.type == 'show'"  :content="browsingContent" :server="server" :library="library" ></plexseries>
    </span>
</template>
 
<script>
import plexcontent from './plexcontent'
import plexseries from './plexseries'

var _ = require('lodash');
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
          size: 100,

          libraryTotalSize: false,
          
          stopNewContent: false,
          busy: false,

          contents: null,
          status: "loading..",
          searchPhrase: null
      }
    },
    mounted() {                    
        



    },
    beforeDestroy(){
        
    },
    watch: {
        searchPhrase: function(){
            this.filterItems()
        }
    },
    computed: {
    },
    watch: {
        browsingContent: function(){
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
            return this.server.getUrlForLibraryLoc(object.thumb,w/12, h/4)
        },
        isShown(item){
            if (!item.active){
                return {
                    display: 'none'
                }
            }
            return {}
        },
        filterItems:_.debounce(
            function () {
                for (let i = 0; i < this.contents.MediaContainer.Metadata.length; i++){
                    let item = this.contents.MediaContainer.Metadata[i]
                    if (!this.searchPhrase){
                        item.active = true
                        continue
                    }
                    if (item.title.toLowerCase().indexOf(this.searchPhrase.toLowerCase()) > -1){
                        item.active = true
                    } else {
                        item.active = false
                    }
                }
            },
            500
        ),
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
                    that.libraryTotalSize = result.MediaContainer.totalSize
                    that.startingIndex = that.startingIndex + 100
                    if (that.contents){
                        for (let i = 0; i < result.MediaContainer.Metadata.length; i++){
                            let media = result.MediaContainer.Metadata[i]
                            media.active = true
                            that.contents.MediaContainer.Metadata.push(media)
                        }
                    } else {
                        for (let i = 0; i < result.MediaContainer.Metadata.length; i++){
                            let media = result.MediaContainer.Metadata[i]
                            media.active = true
                        }
                        that.contents = result
                    }
                    if (result.MediaContainer.size < 100){
                        that.stopNewContent = true
                    }
                    
                } else {
                    that.status = 'Error loading libraries!'
                }
                that.busy = false
                that.getMoreContent()
            })
        },
        reset(){
            this.browsingContent = false
        }

        

 
    }
  }
</script>