<template>
  <div class="portrait">
    <v-card v-on:click="emitContentClicked(content)" :height="height || '20em'">                       
        <div class="pt-content-unwatched pt-orange unwatched" v-if="showUnwatchedFlag"> 
            <span class="pa-2 black--text">
              <span>
                {{ unwatchedCount }}
              </span>
            </span>
        </div>   
        <small v-if="showServer !== undefined" style="position:absolute; top:0;text-align:right;right:0;background: rgba(0, 0, 0, .3)"> {{ server.name }}</small>  
        <v-card-row :img="getImg(content)" height="100%" class="thumb">  </v-card-row>   
        <div class="pt-content-title thumb-title"> 
            <v-layout row>
                <v-flex xs12>
                <v-progress-linear class="pa-0 ma-0 pt-content-progress" v-if="showProgressBar" height="2" :value="unwatchedPercent"></v-progress-linear>
                </v-flex>  
            </v-layout>                              
            <v-layout row>
                <v-flex xs12>
                    <span>{{ getTitle(content) }} </span>
                </v-flex>
            </v-layout>
        </div> 
    </v-card>  
  </div>
</template>

<script>

  export default {

    props: ['library', 'showServer', 'content', 'type', 'server', 'height', 'fullTitle'],
    components: {
    },
    created () {
    },
    data () {
      return {
      }
    },
    mounted () {

    },
    beforeDestroy () {

    },
    computed: {      
      plex () {
        return this.$store.getters.getPlex
      },
      showUnwatchedFlag (){
        if (this.content.type == 'movie' || this.content.type == 'episode'){
          if ( (!this.content.viewCount || this.content.viewCount == 0) && !this.showProgressBar){
            return true
          }
          return false
        }
        if (this.content.type == 'season' || this.content.type == 'show'){
          if ((this.content.leafCount != this.content.viewedLeafCount)){
            return true
          }
          return false
        }
      },
      showProgressBar (){
        if (this.content.type == 'movie' || this.content.type == 'episode'){
          if (this.content.viewOffset && this.content.viewOffset > 0){
            return true
          }
          return false
        }        
        if (this.content.type == 'season' || this.content.type == 'show'){
          if ((this.content.leafCount != this.content.viewedLeafCount) && this.content.viewedLeafCount != 0){
            return true
          }
          return false
        }
      },
      unwatched (){
        if (this.content.type == 'movie' || this.content.type == 'episode'){
          if (this.content.viewCount && this.content.viewCount > 0){
            return false
          }
          return true
        }
      },
      unfinished (){
        // Lol
        if (this.content.type == 'movie' || this.content.type == 'episode'){
          if (!this.content.viewCount || this.content.viewCount == 0){
            if (this.content.viewOffset == 0 || this.content.viewOffset == undefined){
              return true
            } else {
              return false
            }
          }
          return false
        } else {
          if (this.content.viewedLeafCount == 0){
            return false
          }
          if ((this.content.leafCount - this.content.viewedLeafCount) < 1){
            return false
          }
          return true 
        }

      },
      unwatchedCount (){
        if (this.content.type == 'show' || this.content.type == 'season'){
          return (this.content.leafCount - this.content.viewedLeafCount)
        }
        return ''
      },
      unwatchedPercent (){
        if (this.content.type == 'movie' || this.content.type == 'episode'){
          return this.content.duration / this.content.viewOffset
        } else {
          return this.content.viewedLeafCount / this.content.leafCount * 100
        }
      }
    },
    methods: {
      emitContentClicked (content) {
        this.$emit('contentSet',content)
      },
      getTitle(content){
        switch (content.type){
          case 'movie':
            if (content.year){              
              return content.title + ' (' + content.year + ')'
            }
            return content.title
          case 'show': 
            return content.title;
          case 'season':           
            if (this.fullTitle != undefined){              
              return content.parentTitle + '  ' + content.title;
            }
            return content.title;
          case 'episode':
            if (this.fullTitle != undefined){
              return content.grandparentTitle + ' S' + content.parentIndex + 'E' + content.index + ' - ' + content.title;
            }
            return 'Episode ' + content.index
          default: 
            return content.title; 
        }
      },
      getImg (object) {
        var w = Math.round(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
        var h = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        if (this.type == 'art'){          
          return this.server.getUrlForLibraryLoc(object.art, w / 3, h / 1)
        }
        return this.server.getUrlForLibraryLoc(object.thumb, w / 3, h / 1)
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
