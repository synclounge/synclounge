<template>
  <v-bottom-sheet v-model="sheet" hide-overlay persistent>
    <v-card v-if="ready && content && !content.loading" style="max-width: 100%; margin-left: auto; margin-right: auto" class="white--text" :img="background">
      <v-container fluid align-center justify-start v-show="ready" class="pa-0" style="background: rgba(0,0,0,0.7);">
        <v-card-title>
          <h2>Coming up next</h2>
          <v-spacer></v-spacer>
          <v-icon @click="sheet = false" class="clickable">close</v-icon>
        </v-card-title>
        <v-layout row wrap justify-start align-start class="pa-2">
          <v-container fluid grid-list-lg>
            <v-layout row>
              <v-flex xs3 sm2>
                <v-card-media
                :src="thumb"
                  height="125px"
                  contain
                ></v-card-media>
              </v-flex>
              <v-flex>
                <div>
                  <div class="headline">{{ getTitle }}</div>
                  <div>{{ getUnder }}</div>
                  <h5>From {{ plexserver.name }}</h5>
                </div>
                <div class="text-xs-right">
                <span>1.1s</span>
                <v-btn @click="pressPlay" color="primary">Play Now</v-btn>
                <v-btn flat>Cancel</v-btn>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-layout>
        <v-progress-linear :value="percent" class="pa-0 ma-0" height="3"></v-progress-linear>
      </v-container>
    </v-card>
  </v-bottom-sheet>
</template>

<script>

export default {
  components: {
  },
  data () {
    return {
      sheet: true,
      maxTimer: 10000,
      timer: 10000,
      cache: {}
    }
  },
  mounted: async function () {

  },
  watch: {
    item: function (to) {
      if (to) {
        this.cache[to.ratingKey] = to
      }
    },
    ready: function (to) {
      if (to) {
        this.startTimer()
      }
    }
  },
  methods: {
    pressPlay: function () {
      this.chosenClient.playMedia({
        ratingKey: this.item.ratingKey,
        mediaIndex: null,
        server: this.plexserver,
        offset: 0
      })
    },
    startTimer: function () {
      let ratingKey = this.item.ratingKey
      let ticker = setInterval(() => {
        this.timer = this.timer - 50
        if (this.timer < 1) {
          this.pressPlay(this.cache[ratingKey])
          clearInterval(ticker)
        }
      }, 50)
    }
  },
  computed: {
    ready: function () {
      return (
        this.chosenClient &&
        this.chosenClient.lastTimelineObject &&
        this.$store.state.upNextCache[this.chosenClient.lastTimelineObject.machineIdentifier] &&
        this.$store.state.upNextCache[this.chosenClient.lastTimelineObject.machineIdentifier][this.chosenClient.lastTimelineObject.key]
      )
    },
    percent: function () {
      return (this.maxTimer / this.timer) * 100
    },
    background: function () {
      return this.plexserver.getUrlForLibraryLoc(this.item.art, 1000, 450)
    },
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
