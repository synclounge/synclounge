<template>
  <v-bottom-sheet v-model="sheet" max-width="250px" hide-overlay persistent>
    <v-container align-center justify-start v-show="item" class="toolbar pa-0">
      <v-layout row wrap class="pa-2">
        <v-flex xs12>
          <h1>Coming up next</h1>
        </v-flex>
      </v-layout>
      <v-layout row wrap justify-start align-start v-if="content && !content.loading" class="pa-2">
        <v-card flat style="background: none" class="white--text">
          <v-container fluid grid-list-lg>
            <v-layout row>
              <v-flex xs3 sm1>
                <v-card-media
                :src="thumb"
                  height="125px"
                  contain
                ></v-card-media>
              </v-flex>
              <v-flex xs7 sm5>
                <div>
                  <div class="headline">{{ getTitle }}</div>
                  <div>{{ getUnder }}</div>
                  <h5>From {{ plexserver.name }}</h5>
                  <p> {{ item.summary }}</p>
                </div>
              </v-flex>
              <v-flex xs2 sm6 class="text-xs-center">
                <v-container class="pa-0">
                  <v-layout row wrap justify-center align-center>
                    <v-flex xs12>
                      <v-btn @click="pressPlay" fab dark large color="primary">
                        <v-icon dark>play_arrow</v-icon>
                      </v-btn>
                    </v-flex>
                    <v-flex xs12>
                      Play Now
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-layout>
      <v-progress-linear :value="90" class="pa-0 ma-0" height="3"></v-progress-linear>
    </v-container>
  </v-bottom-sheet>
</template>

<script>

export default {
  components: {
  },
  data () {
    return {
      sheet: true
    }
  },
  mounted: async function () {
    setTimeout(() => {
      if (this.sheet) {
        console.log('We should autoplay!')
      }
    }, 10000)
  },
  methods: {
    pressPlay: function () {
      this.chosenClient.playMedia({
        ratingKey: this.item.ratingKey,
        mediaIndex: null,
        server: this.plexserver,
        offset: 0
      })
    }
  },
  computed: {
    plex: function () {
      return this.$store.getters.getPlex
    },
    plexserver: function () {
      return this.plex.servers[this.chosenClient.lastTimelineObject.machineIdentifier]
    },
    thumb: function () {
      return this.plexserver.getUrlForLibraryLoc(this.item.grandparentThumb, 1000, 450)
    },
    item: function () {
      if (!this.content || this.content.loading) {
        return
      }
      return this.content.MediaContainer.Hub[0].Metadata[0]
    },
    content: function () {
      return this.$store.state.upNextCache[this.chosenClient.lastTimelineObject.machineIdentifier][this.chosenClient.lastTimelineObject.key]
    },
    chosenClient: function () {
      return this.$store.getters.getChosenClient
    },
    getTitle () {
      switch (this.item.type) {
        case 'movie':
          if (this.fullTitle !== undefined) {
            if (this.item.year) {
              return this.item.title + ' (' + this.item.year + ')'
            }
          }
          return this.item.title
        case 'show':
          return this.item.title
        case 'season':
          return this.item.title
        case 'episode':
          return this.item.grandparentTitle
        default:
          return this.item.title
      }
    },
    getUnder () {
      switch (this.item.type) {
        case 'movie':
          if (this.item.year) {
            return this.item.year
          }
          return ' '
        case 'show':
          if (this.item.childCount === 1) {
            return this.item.childCount + ' season'
          }
          return this.item.childCount + ' seasons'
        case 'season':
          return this.item.leafCount + ' episodes'
        case 'album':
          return this.item.year
        case 'artist':
          return ''
        case 'episode':
          return (
            ' S' +
            this.item.parentIndex +
            'E' +
            this.item.index +
            ' - ' +
            this.item.title
          )
        default:
          return this.item.title
      }
    }
  }
}
</script>
