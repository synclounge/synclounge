<template>
  <div style="position:relative">
    <img style="position:absolute;width:100%;height:auto;z-index:0;opacity:0.1" :src="metadataArt"/>
    <div class="row center container" style="z-index:3;margin-bottom:0">
      <div class="col s12 m12 l12" style="margin-top:20%;opacity:0.9">
        <div class="row">
          <div class="col s12 l4 m4">
            <img :src="metadataThumb" style="width:100%;height:auto">
          </div>
          <div class="col s12 l8 m8" style="text-align:left">
            <h3> Now Playing </h3>
            <h2> {{ chosenClient.name }} </h2>
            <label>Playing {{ metadataTitle }} {{ metadataInfo }} from {{ metadataServer }}</label>
            <p> {{ metadata.summary }}</p>
          </div>
        </div>
      </div>
    </div>
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
        if (!plexObj.getServerById(metadata.machineIdentifier)) {
          return ''
        }
        return plexObj.getServerById(metadata.machineIdentifier).getUrlForLibraryLoc(content, 700, 700)
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
        if (!plexObj.getServerById(metadata.machineIdentifier)) {
          return ''
        }
        return plexObj.getServerById(metadata.machineIdentifier).getUrlForLibraryLoc(content, 700, 700, 1)
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
        return (this.plex.getServerById(this.chosenClient.clientPlayingMetadata.machineIdentifier).name)
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
          return '(' + metadata.year + ')'
        }
        if (metadata.type == 'episode') {
          return metadata.title + ' (S' + metadata.parentIndex + '·E' + metadata.index + ')'
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

