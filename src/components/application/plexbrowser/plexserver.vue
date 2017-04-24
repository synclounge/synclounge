<template>
    <div>
        <h2 v-if="!browsingLibrary"> {{ server.name }}</h2>
        <div v-if="libraries && !browsingLibrary" v-for="library in filteredLibraries">
            <v-card v-on:click.native="setLibrary(library)" class="blue-grey darken-1 col l3 s12">
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
        <plexlibrary v-if="browsingLibrary" :library="browsingLibrary" :server="server"></plexlibrary>
    </div>
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
            console.log('Getting url for thumb ' + object.thumb)
            return this.server.getUrlForLibraryLoc(object.thumb)
        },

        

 
    }
  }
</script>