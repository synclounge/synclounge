<template>
  <div style="position:relative">
    <v-layout flex wrap row style="margin-top:15%">
      <v-flex xs12 md10 offset-md1>
        <v-card horizontal :img="metadataArt">          
          <v-layout flex wrap row style="background: rgba(0,0,0,0.5); " class="pl-0 pr-0">
            <v-flex md4 xl2 class="pa-0 ma-0 hidden-xs-only" style="position:relative">
              <img :src="metadataThumb" class="pa-4" style="width:auto;height:auto; max-width:100%;max-height:100%;position: absolute; margin:auto; left:0; right:0; bottom:0; top:0"></img>
            </v-flex>            
            <v-flex md8 xl10 class="pa-4">
              <v-subheader light> Now Playing </v-subheader>
              <h3> {{ metadataTitle }} </h3>
              <h6> {{ metadataInfo }} </h6>
              <label>Playing on {{ chosenClient.name }} from {{ metadataServer }}</label>
              <v-divider></v-divider>
              <p class="pt-3" style="font-style: italic"> {{ metadata.summary }} </p>    
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>

  export default {
    props: ['object'],
    name: 'nowplaying',
    data () {
      return {}
    },
    components: {},
    computed: {
      chosenClient: function () {
        return this.$store.getters.getChosenClient
      },
      plex: function () {
        return this.$store.getters.getPlex
      },
      validPlex: function () {
        if (!this.$store.state.plex) {
          return false
        }
        return true
      },
      context: function () {
        return this.$store
      },
      backgroundImgObj: function () {
        return {
          'background-image': this.metadataArt
        }
      },
      metadataThumb: function () {
        if (!this.validPlex) {
          return ''
        }
        let plexObj = this.$store.state.plex
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        let server;
        let content = metadata.thumb;
        if (metadata.parentThumb) {
          content = metadata.parentThumb
        }
        if (!plexObj.servers[metadata.machineIdentifier]) {
          return ''
        }
        return plexObj.servers[metadata.machineIdentifier].getUrlForLibraryLoc(content, 700, 700)
      },
      metadataArt: function () {
        if (!this.validPlex) {
          return ''
        }
        let plexObj = this.$store.state.plex
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        let server;
        let content = metadata.art;
        if (!plexObj.servers[metadata.machineIdentifier]) {
          return ''
        }
        return plexObj.servers[metadata.machineIdentifier].getUrlForLibraryLoc(content, 700, 700, 8)
      },
      metadataServer: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        return (this.plex.server[this.chosenClient.clientPlayingMetadata.machineIdentifier].name)
      },
      metadataTitle: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        if (metadata.type == 'movie') {
          return metadata.title
        }
        if (metadata.type == 'episode') {
          return metadata.grandparentTitle
        }
        return metadata.index
      },
      metadataInfo: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        let metadata = this.$store.getters.getChosenClient.clientPlayingMetadata
        if (!metadata) {
          return ''
        }
        if (metadata.type == 'movie') {
          return + metadata.year 
        }
        if (metadata.type == 'episode') {
          return metadata.title + ' S' + metadata.parentIndex + '·E' + metadata.index + ''
        }
        return metadata.index

      },
      metadata: function () {
        if (!this.validPlex) {
          return ''
        }
        if (!this.$store.getters.getChosenClient) {
          return ''
        }
        return this.$store.getters.getChosenClient.clientPlayingMetadata
      }
    },
    methods: {}
  }
</script>

