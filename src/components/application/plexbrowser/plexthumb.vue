<template>
  <div class="portrait" ref="root" style="cursor: pointer">
    <v-card data-tilt v-on:click="emitContentClicked(content)" class="grey darken-4" :img="getImg(content)" :height="calculatedHeight">                       
        <div class="pt-content-unwatched pt-orange unwatched" v-if="showUnwatchedFlag"> 
            <span class="pa-2 black--text">
              <span>
                {{ unwatchedCount }}
              </span>
            </span>
        </div>   
        <small v-if="showServer !== undefined" style="position:absolute; top:0;text-align:right;right:0;background: rgba(0, 0, 0, .5)"> {{ server.name }}</small>  
        <v-card-row :height="fakeRowHeight"  class="white--text">
        
        </v-card-row>
        <v-card-column style="background: rgba(0, 0, 0, .8);">
          <v-card-row :height="bottomCalculatedHeight" style="position:relative;" class="ma-0">
            <v-progress-linear style="position:absolute; top:0; width:100%" class="pa-0 ma-0 pt-content-progress" v-if="showProgressBar" height="2" :value="unwatchedPercent"></v-progress-linear>                           
            <v-layout  row wrap class="text-xs-left ma-1" style="margin:0; display:block; max-width:100%; height:100%">

                <v-flex xs12 style="height:50%" ref="topText" class="pa-0 ma-1">
                    <div v-tooltip:top="{ html: getTitle(content) }" class="truncate" :style="fontSizeTop">{{ getTitle(content) }}</div>
                </v-flex>                  
                <v-flex xs12 style="height:50%" ref="bottomText" class="pa-0 ma-1">
                    <div class="truncate" style="opacity:0.75" :style="fontSizeBottom">{{ getUnder(content) }}</div>
                </v-flex>
            </v-layout> 
          </v-card-row>
        </v-card-column>
        <!--   
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
        </div> -->
    </v-card>  
  </div>
</template>

<script>

  export default {

    props: ['library', 'showServer', 'content', 'type', 'server', 'height', 'fullTitle', 'search', 'locked'],
    components: {
    },
    created () {
    },
    data () {
      return {
        fullheight: null,
        fullwidth: null,
        toptextheight: null,
        bottomtextheight: null
      }
    },
    mounted () {
      this.fullheight = this.$refs.root.offsetHeight
      this.fullwidth = this.$refs.root.offsetWidth  

      this.toptextheight = this.$refs.topText.offsetHeight
      this.bottomtextheight = this.$refs.bottomText.offsetHeight
      if (this.type == 'thumb'){
        VanillaTilt.init(this.$refs.root, {
          reverse:            false,  // reverse the tilt direction
          max:                7,     // max tilt rotation (degrees)
          perspective:        2000,   // Transform perspective, the lower the more extreme the tilt gets.
          scale:              1.01,      // 2 = 200%, 1.5 = 150%, etc..
          speed:              100,    // Speed of the enter/exit transition
          transition:         true,   // Set a transition on enter/exit.
          axis:               null,   // What axis should be disabled. Can be X or Y.
          reset:              true,    // If the tilt effect has to be reset on exit.
          easing:             "cubic-bezier(.03,.98,.52,.99)",    // Easing on enter/exit.
          glare:              false,   // if it should have a "glare" effect
          "max-glare":        1,      // the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
          "glare-prerender":  false   // false = VanillaTilt creates the glare elements for you, otherwise
        });
      }
      
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
      fontSizeTop () {
        return {'font-size':(this.toptextheight * 0.8) + 'px'}
      },      
      fontSizeBottom () {
        return {'font-size':(this.bottomtextheight * 0.6) + 'px'}
      },      
      fullCalculatedHeightRaw (){
        if (this.height){
          return this.height
        }
        if (this.content.type == 'movie'){
          return Math.round(this.fullwidth * 1.5)
        }        
        if (this.content.type == 'episode'){
          return Math.round(this.fullwidth * 0.7)
        }
        return Math.round(this.fullwidth * 1.5)
      }, 
      fakeRowHeight (){        
        if (this.height){
          return Math.round(this.height * 0.78) + 'em' 
        }
        if (this.content.type == 'movie'){
          return Math.round(this.fullwidth * 1.5 * 0.78) + 'px'
        }        
        if (this.content.type == 'episode'){
          return Math.round(this.fullwidth * 0.7 * 0.78) + 'px'
        }
        return Math.round((this.fullwidth * 1.5 * 0.78)) + 'px'
      },
      calculatedHeight (){
        if (this.height){
          return this.height + 'em'
        }
        if (this.content.type == 'movie'){
          return Math.round(this.fullwidth * 1.5) + 'px'
        }        
        if (this.content.type == 'episode'){
          return Math.round(this.fullwidth * 0.7) + 'px'
        }
        return Math.round(this.fullwidth * 1.5) + 'px'
      },      
      bottomCalculatedHeight (){
        if (this.height){
          return Math.round(this.height * 0.22) + 'em'
        }
        if (this.content.type == 'movie'){
          return Math.round((this.fullwidth * 1.5) * 0.22) + 'px'
        }        
        if (this.content.type == 'episode'){
          return Math.round(this.fullwidth * 0.7 * 0.22) + 'px'
        }
        return Math.round(this.fullwidth * 1.5 * 0.22) + 'px'
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
            if (this.fullTitle != undefined){   
              if (content.year){              
                return content.title + ' (' + content.year + ')'
              }
            }
            return content.title
          case 'show': 
            return content.title;
          case 'season':           
            if (this.fullTitle != undefined){              
              return content.parentTitle + '  ' + content.title;
            }
            return content.parentTitle;
          case 'episode':
            if (this.fullTitle != undefined){
              return content.title
            }
            return content.grandparentTitle
          default: 
            return content.title; 
        }
      }, 
      getUnder(content){
        switch (content.type){
          case 'movie':
            if (content.year){              
              return content.year
            }
            return ' '
          case 'show': 
            if (content.childCount == 1){
              return content.childCount + ' season';
            }
            return content.childCount + ' seasons';
          case 'season':           
            if (this.fullTitle != undefined){              
              return content.parentTitle + '  ' + content.title;
            }
            return content.title;
          case 'episode':
            if (this.fullTitle != undefined){
              return 'Episode ' + content.index
            }
            return ' S' + content.parentIndex + 'E' + content.index + ' - ' + content.title;
          default: 
            return content.title; 
        }
      },
      getImg (object) {
        var w = Math.round(this.fullwidth * 1.5)
        var h = Math.round(this.fullheight * 1.5)
        if (this.type == 'art'){          
          return this.server.getUrlForLibraryLoc(object.art, w, h)
        }
        return this.server.getUrlForLibraryLoc(object.thumb, w, h)
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
