<template>
    <span>
        <span v-on:click="reset()">{{ server.name }}<span v-if="browsingLibrary"> ></span></span>
        <div v-if="!browsingLibrary">
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
            <div v-if="!libraries && !browsingLibrary" class="center" >
                <v-progress-circular active large></v-progress-circular>
            </div>
        </div>
        <plexlibrary v-if="browsingLibrary" :library="browsingLibrary" :server="server"></plexlibrary>
    </span>
</template>
 
<script>
import plexlibrary from './plexlibrary'
  export default {
    props: ['server'],
    components: {
        plexlibrary
    },
    created(){
        // Hit the PMS endpoing /library/sections
        var that = this
        this.server.getAllLibraries(function(result){
            if (result){
                that.libraries = result
            } else {
                that.status = 'Error loading libraries!'
            }
        })
    },
    data() {
      return {
          browsingLibrary: null,

          libraries: null,
          status: "loading..",
      }
    },
    mounted() {                    
        



    },
    beforeDestroy(){
        
    },
    computed: {
      filteredLibraries(){
          if (this.libraries){
            return this.libraries.MediaContainer.Directory
          }
          return []
      }
      
    },
    methods: {
        setLibrary(library){
            this.browsingLibrary = library
        },
        getThumb(object){
            var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
            var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
            return this.server.getUrlForLibraryLoc(object.thumb,w/12, h/4)
        },
        reset(){
            this.browsingLibrary = false
        }

        

 
    }
  }
</script>