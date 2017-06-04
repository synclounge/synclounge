<template>
    <span>
        <span v-on:click="reset()" style="cursor: pointer !important">{{ server.name }}<span v-if="browsingLibrary || selectedItem"> ></span></span>
        <div v-if="!browsingLibrary && !selectedItem">
            <div v-if="!libraries && !browsingLibrary" class="center" >
                <v-progress-circular active large></v-progress-circular>
            </div>
            <h2> Libraries </h2>
            <div v-if="libraries && !browsingLibrary" v-for="library in filteredLibraries">
                <v-card v-on:click.native="setLibrary(library)" class="blue-grey darken-1 col l3 s12 hoverable" style="box-shadow:none">
                    <div class="col s3 l3" style="height:100%">
                        <img :src="getThumb(library)" style="height:100%; width:100%" >
                    </div>
                    <div class="col s9 l9">
                        <div style="font-size: 1vw;">{{ library.title }}</div>
                    </div>
                </v-card>
            </div>
            <h2> On Deck </h2>
            <div v-if="!libraries && !browsingLibrary && !selectedItem" class="center" >
                <v-progress-circular active large></v-progress-circular>
            </div>
            <div v-if="onDeck.length != 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                <div v-for="content in subsetOnDeck(3)">
                    <v-card v-if="content.type == 'movie'" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l4 s12 hoverable" style="box-shadow:none">
                        <div style="height:100%">
                            <img style="height:auto;width:100%;display:block" v-lazy="getArt(content)"/>                            
                            <v-progress-linear determinate :width="progress(content)" style="padding-top:0;margin-top:0;background-color:grey;margin:0"></v-progress-linear>
                            <div style="margin-left:1%;">
                                <span style="font-size: 1.5vh;" class="card-title truncate">{{ content.title }}</span>
                                <div> 
                                    <label style="display:block"> {{ content.year }}</label> 
                                </div>
                            </div>
                        </div>
                    </v-card>          
                    <v-card v-if="content.type == 'episode'" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l4 s12 hoverable" style="box-shadow:none">
                        <div style="height:100%;bottom:0">
                            <img style="height:auto;width:100%;display:block" v-lazy="getArt(content)"/>
                            <v-progress-linear determinate :width="progress(content)" style="padding-top:0;margin-top:0;background-color:grey;margin:0"></v-progress-linear>
                            <div style="padding-left:1%; height:25%;">
                                <span style="font-size: 1.5vh;" class="card-title truncate">{{ content.grandparentTitle }}</span>
                                <div> 
                                    <label> S{{ content.parentIndex }}E{{ content.index}} </label> 
                                    <label> - {{ content.title }} </label> 
                                </div>
                            </div>
                        </div>
                    </v-card>
                </div>
            </div>
            <h2> Recently Added </h2>           
            <div v-if="!libraries && !browsingLibrary && !selectedItem" class="center" >
                <v-progress-circular active large></v-progress-circular>
            </div>
            <div v-if="recentlyAdded.length != 0" class="row" style="border-bottom:1px solid rgba(0,0,0,0.12)"> 
                <div v-for="content in subsetRecentlyAdded(12)">
                    <v-card v-if="content.type == 'movie'" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:250px">
                        <div style="height:100%">
                            <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                            <div style="margin:3%; margin-left:1%; height:25%;">
                                <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                                <div> 
                                    <label style="display:block"> {{ content.year }}</label> 
                                </div>
                            </div>
                        </div>
                    </v-card>          
                    <v-card v-if="content.type == 'episode'" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:250px">
                        <div style="height:100%;bottom:0">
                            <img style="height:auto;width:100%;display:block" v-lazy="getGrandparentThumb(content)"/>
                            <div style="padding:3%; padding-left:1%; height:25%;">
                                <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                                <div> 
                                    <label style="display:block"> {{ content.grandparentTitle }} </label> 
                                    <label style="display:block"> S{{ content.parentIndex }}E{{ content.index}} </label> 
                                </div>
                            </div>
                        </div>
                    </v-card>
                    <v-card v-if="content.type == 'season'" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:250px">
                        <div style="height:100%;bottom:0">
                            <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                            <div style="padding:3%; padding-left:1%; height:25%;">
                                <span style="font-size: 1vh;" class="card-title truncate">{{ content.parentTitle }}</span>
                                <div> 
                                    <label style="display:block"> {{ content.title }} </label> 
                                </div>
                            </div>
                        </div>
                    </v-card>                    
                    <v-card v-if="content.type == 'series'" v-on:click.native="setContent(content)" class="blue-grey darken-1 col l1 s12 hoverable" style="box-shadow:none;height:250px">
                        <div style="height:100%;bottom:0">
                            <img style="height:auto;width:100%;display:block" v-lazy="getThumb(content)"/>
                            <div style="padding:3%; padding-left:1%; height:25%;">
                                <span style="font-size: 1vh;" class="card-title truncate">{{ content.title }}</span>
                            </div>
                        </div>
                    </v-card>
                </div>
            </div>
        </div>            
        <span v-if="selectedItem">
            <plexcontent v-if="selectedItem.type == 'episode' || selectedItem.type == 'movie'" :server="server" :content="selectedItem">
            </plexcontent>            
            <plexseason v-if="selectedItem.type == 'season'" :server="server" :content="selectedItem">
            </plexseason>            
            <plexseries v-if="selectedItem.type == 'show'" :server="server" :content="selectedItem">
            </plexseries>
        </span>
        <plexlibrary v-if="browsingLibrary" :library="browsingLibrary" :server="server"></plexlibrary>
    </span>
</template>
 
<script>

import plexcontent from './plexcontent'
import plexseason from './plexseason'
import plexseries from './plexseries'
import plexlibrary from './plexlibrary'

  export default {
    props: ['server'],
    components: {
        plexlibrary,
        plexcontent,
        plexseason,
        plexseries
    },
    created(){
        // Hit the PMS endpoing /library/sections
        var that = this

    },
    data() {
      return {
          browsingLibrary: null,
          selectedItem: null,

          libraries: null,
          status: "loading..",

          recentlyAdded: [],
          onDeck: []
      }
    },
    mounted() {                    
        this.server.getAllLibraries((result) => {
            if (result){
                this.libraries = result
            } else {
                this.status = 'Error loading libraries!'
            }
        })
        this.server.getRecentlyAddedAll(0,12,(result) => {
            console.log('Recently added result', result)
            if (result){
                this.recentlyAdded = result
            }
        })       
        this.server.getOnDeck(0,10,(result) => {
            if (result){
                this.onDeck = result
            }
        })



    },
    beforeDestroy(){
        
    },
    computed: {
      filteredLibraries(){
          if (this.libraries){
            return this.libraries.MediaContainer.Directory
          }
          return []
      },
      
    },
    methods: {
        setContent(content){
            this.selectedItem = content
        },
        setLibrary(library){
            this.browsingLibrary = library
        },   
        subsetOnDeck(size){
            return this.onDeck.MediaContainer.Metadata.slice(0,size)
        },
        subsetRecentlyAdded(size){
            return this.recentlyAdded.MediaContainer.Metadata.slice(0,size)
        },   
        progress(content){
            let perc = (parseInt(content.viewOffset) / parseInt(content.duration))*100
            if (isNaN(perc)){
                perc = 0
            }
            return perc + '%'
        },  
        getArt(object){
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.art,w/3, h/4)
        }, 
        getThumb(object){
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.thumb,w/12, h/4)
        },        
        getGrandparentThumb(object){
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.grandparentThumb,w/12, h/4)
        },
        reset(){
            this.browsingLibrary = false
            this.selectedItem = false
        }

        

 
    }
  }
</script>