<template>
  <div class="portrait" ref="root" style="cursor: pointer" @mouseover="hovering = true" @mouseout="hovering = false">


      <v-card data-tilt v-on:click="emitContentClicked(content)" class="grey darken-4" style="border:solid">
        <v-card-media
          class="white--text"
          style="position:relative"
          :height="calculatedHeight"
          :src="getImg(content)"
        >
          <v-container class="pa-0 ma-0" fill-height fluid style="position:relative">
            <v-layout>
              <v-flex xs12>
                <small v-if="showServer !== undefined" style="position:absolute; top:0;text-align:right;right:0;background: rgba(0, 0, 0, .5)"> {{ server.name }}</small>  
                <div class="pt-content-unwatched pt-orange unwatched" v-if="showUnwatchedFlag && showServer == undefined"> 
                  <span class="pa-2 black--text">
                    <span>
                      {{ unwatchedCount }}
                    </span>
                  </span>
                </div>         
                <div style="position:absolute; right:0; background-color: rgba(43, 43, 191, 0.8)" v-if="content.Media && content.Media.length != 1 && showServer == undefined"> 
                    <span class="pa-2 black--text">
                      <span>
                        {{ content.Media.length }}
                      </span>
                    </span>
                </div>    
                <div :style="{'height': bottomCalculatedHeight}" style="background: rgba(0, 0, 0, .8);position:absolute; bottom: 0; width:100%">
                  <div class="ma-0">
                    <v-progress-linear style="position:absolute; top:0; width:100%" class="pa-0 ma-0 pt-content-progress" v-if="showProgressBar" height="2" :value="unwatchedPercent"></v-progress-linear>                           
                    <v-layout row wrap class="text-xs-left" style="margin:0; margin-left:3px; display:block; max-width:100%; height:100%">
                        <v-flex v-if="!onlyBottom" xs12 style="height:50%" :style="topTextStyle" ref="topText" class="pa-0 ma-0 ml-1 mt-1">
                            <div v-tooltip:top="{ html: getTitle(content) }" class="truncate" style="font-size:1rem">{{ getTitle(content) }}</div>
                        </v-flex>                  
                        <v-flex xs12 style="height:50%; font-size:0.8rem"  :style="bottomTextStyle" ref="bottomText" class="pa-0 ma-0 mt-0 ml-1">
                            <div class="truncate soft-text" style=" position:absolute; bottom:0">{{ getUnder(content) }}</div>
                        </v-flex>
                    </v-layout> 
                  </div>
                </div> 
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-media>
      </v-card>
  </div>
</template>

<script>

  export default {

    props: ['library', 'showServer', 'content', 'type', 'server', 'height', 'fullTitle', 'search', 'locked', 'img', 'bottomOnly', 'spoilerFilter'],
    components: {
    },
    created () {
      window.addEventListener('resize', this.handleResize)
    },
    data () {
      return {
        fullheight: null,
        fullwidth: null,
        toptextheight: null,
        bottomtextheight: null,

        hovering:false
      }
    },
    mounted () {
      this.fullheight = this.$refs.root.offsetHeight
      //console.log(this.$refs)
      this.fullwidth = this.$refs.root.offsetWidth  
      if (this.$refs.topText){
        this.toptextheight = this.$refs.topText.offsetHeight
      }
      if (this.$refs.bottomText){
        this.bottomtextheight = this.$refs.bottomText.offsetHeight
      }
      if (this.type == 'thumb'){
        VanillaTilt.init(this.$refs.root, {
          reverse:            true,  // reverse the tilt direction
          max:                7,     // max tilt rotation (degrees)
          perspective:        1000,   // Transform perspective, the lower the more extreme the tilt gets.
          scale:              1.02,      // 2 = 200%, 1.5 = 150%, etc..
          speed:              100,    // Speed of the enter/exit transition
          transition:         true,   // Set a transition on enter/exit.
          axis:               null,   // What axis should be disabled. Can be X or Y.
          reset:              true,    // If the tilt effect has to be reset on exit.
          easing:             "cubic-bezier(.03,.98,.52,.99)",    // Easing on enter/exit.
          glare:              false,   // if it should have a "glare" effect
          "max-glare":        0.15,      // the maximum "glare" opacity (1 = 100%, 0.5 = 50%)
          "glare-prerender":  false   // false = VanillaTilt creates the glare elements for you, otherwise
        });
      }
      
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.handleResize)
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
        let size = (this.toptextheight * 0.7)
        if (size > 18){
          size = 18
        }
        return {'font-size':size + 'px'}
      },      
      fontSizeBottom () {       
        let size = (this.bottomtextheight * 0.7)
        if (size > 14){
          size = 14
        }
        return {'font-size':(size * 1) + 'px'}
      },     
      onlyBottom () {
        if (this.bottomOnly != undefined || this.bottomOnly != null){
          return true
        }
        return false
      },       
      hideThumb () {
        if (this.spoilerFilter != undefined || this.spoilerFilter != null){
          return true
        }
        return false
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
        if (this.height && this.type == 'thumb'){
          return Math.round(this.height * 0.22) + 'em'
        }             
        if (this.height && this.type == 'art'){
          return Math.round(this.height * 0.15) + 'em'
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
      topTextStyle (){
        if (this.onlyBottom){
          return {
            height:'0%'
          }
        }
        return {
          height:'50%'
        }
      },
      bottomTextStyle (){
        if (this.onlyBottom){
          return {
            height:'100%',
            'font-size':'1rem'
          }
        }
        return {
          height:'50%'
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
          return this.content.viewOffset / this.content.duration * 100
        } else {
          return this.content.viewedLeafCount / this.content.leafCount * 100
        }
      }
    },
    methods: {
      emitContentClicked (content) {
        this.$emit('contentSet',content)
      },
      handleResize () {        
        this.fullheight = this.$refs.root.offsetHeight
        this.fullwidth = this.$refs.root.offsetWidth  
        console.log(this.$refs.root.offsetHeight)
        if (this.$refs.topText){
          this.toptextheight = this.$refs.topText.offsetHeight
        }
        if (this.$refs.bottomText){
          this.bottomtextheight = this.$refs.bottomText.offsetHeight
        }
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
              return content.parentTitle
            }         
            return content.title;
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
              return content.title;
            }
            return content.leafCount + ' episodes'          
          case 'album':                     
            return content.year;         
          case 'artist':                
            return '';
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
        var w = Math.round(this.fullwidth * 2)
        var h = Math.round(this.fullheight * 2)        
        if (!this.hovering && this.hideThumb && (!this.content.viewCount || this.content.viewCount == 0)){          
          return this.server.getUrlForLibraryLoc(object.art, w, 1000)
        }
        if (this.img){
          return this.img
        }
        if (this.type == 'art'){          
          return this.server.getUrlForLibraryLoc(object.art, w, 1000)
        }
        return this.server.getUrlForLibraryLoc(object.thumb, w, 1000)
      },
      reset () {
        this.browsingContent = false
      }

    }
  }
</script>
