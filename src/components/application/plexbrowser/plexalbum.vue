<template>
    <span>
      <span v-on:click="reset()" style="cursor: pointer !important"> {{ content.title }}<span
          v-if="browsingContent"> > </span> </span>
      <v-layout v-if="!contents && !browsingContent" row>
        <v-flex xs12 style="position:relative">
            <v-progress-circular style="left: 50%; top:50%" v-bind:size="60" indeterminate class="amber--text"></v-progress-circular>
        </v-flex>
      </v-layout>
      <div v-if="contents && !browsingContent" class="mt-3">    
          <v-card horizontal height="25em" :img="getArtUrl">
            <v-card-row class="hidden-sm-and-down" :img="getThumb" height="100%"></v-card-row>
            <v-card-column style="background: rgba(0, 0, 0, .4)">
              <v-card-row height="11em"  class="white--text">
                <v-card-text>
                  <h3> {{ content.parentTitle }}</h3>
                  <h6>{{ content.title }}</h6>
                  <h4> {{content.year}} </h4>
                  <p> {{ contents.MediaContainer.size }} tracks </p>
                </v-card-text>
              </v-card-row>
              <v-card-row actions class="pa-4" style="background: rgba(0,0,0,0.4)">    
                <v-btn style="width:15%" v-on:click.native="playMedia(content)" raised large class="primary white--text">
                  <v-icon light>play_arrow</v-icon> Play
                </v-btn>
              </v-card-row>
            </v-card-column>
          </v-card>
          <h4 class="mt-3"> Tracks </h4>
          <v-divider></v-divider>
          <div>          
              <v-layout class="row mt-3" v-for="content in contents.MediaContainer.Metadata" :key="content" row wrap>
                <v-flex xs1 md1>
                  <v-icon class="click-cursor" large light v-on:click="playMedia(content)">play_arrow</v-icon>                  
                </v-flex>                
                <v-flex xs4 md3 class="click-cursor" v-on:click="playMedia(content)">                  
                  <span class="soft-text" >{{ content.index }}</span>. {{ content.title }}
                </v-flex>                
                <v-flex xs4 md2>
                  <span class="soft-text">{{ getDuration(content) }}</span>
                </v-flex>                
                <v-flex md3>
                  <span class="soft-text" v-for="media in content.Media" :key="media">
                    {{ media.audioCodec }} ({{ media.audioChannels }}ch) <span v-if="content.Media.length > 1">,</span>
                  </span>  
                </v-flex>
            </v-layout>  
          </div>
        </div>
        <plexcontent v-if="browsingContent && browsingContent.type != 'show'" :content="browsingContent"
                     :server="server" :library="library"></plexcontent>
    </span>
</template>

<script>
import plexcontent from "./plexcontent";
import plexthumb from "./plexthumb.vue";

var humanizeDuration = require("humanize-duration");
humanizeDuration.languages.shortEn = {
  s: function(c) {
    return c + "";
  },
  m: function(c) {
    return c + "";
  }
};

export default {
  props: ["library", "server", "content"],
  components: {
    plexcontent,
    plexthumb
  },
  created() {
    // Hit the PMS endpoing /library/sections
    var that = this;
    this.server.getSeriesContent(this.content.key, 0, 500, 1, result => {
      if (result) {
        this.contents = result;
        this.setBackground();
      } else {
        this.status = "Error loading content!";
      }
    });
  },
  data() {
    return {
      browsingContent: null,

      contents: null,
      status: "loading.."
    };
  },
  watch: {
    browsingContent: function() {
      if (!this.browsingContent) {
        this.$store.commit("SET_BACKGROUND", null);
      }
    }
  },
  mounted() {},
  beforeDestroy() {},
  computed: {
    getArtUrl() {
      var w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      );
      var h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      );
      return this.server.getUrlForLibraryLoc(
        this.contents.MediaContainer.banner,
        w / 2,
        h / 1,
        5
      );
    },
    chosenClient() {
      return this.$store.getters.getChosenClient;
    },
    playable() {
      if (this.nowPlaying || this.nowPlaying == "") {
        return false;
      }
      return true;
    },
    getThumb() {
      var w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      );
      var h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      );
      return this.server.getUrlForLibraryLoc(
        this.contents.MediaContainer.grandparentThumb,
        w / 1,
        h / 2
      );
    }
  },
  methods: {
    setContent(content) {
      this.browsingContent = content;
    },
    setBackground() {
      var w = Math.round(
        Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      );
      var h = Math.round(
        Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      );

      this.$store.commit(
        "SET_BACKGROUND",
        this.server.getUrlForLibraryLoc(
          this.contents.MediaContainer.art,
          w / 4,
          h / 4,
          8
        )
      );
    },
    reset() {
      this.browsingContent = false;
      this.setBackground();
    },
    getDuration(item) {
      return humanizeDuration(item.duration, {
        delimiter: " ",
        units: ["m", "s"],
        round: true
      });
    },
    playMedia(content) {
      console.log("Playing this: ", content);
      this.chosenClient.playMedia(content.ratingKey, this.server, function(
        result
      ) {
        console.log("Auto play result: ", result);
      });
    }
  }
};
</script>
