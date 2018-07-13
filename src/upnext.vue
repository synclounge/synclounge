<template>
  <v-bottom-sheet v-model="sheet" hide-overlay persistent>
    <v-card v-if="ready && content && !content.loading" style="max-width: 100%; margin-left: auto; margin-right: auto" class="white--text pa-0" :img="background">
      <v-container fluid align-center justify-start v-show="ready" class="pa-0" style="background: rgba(0,0,0,0.7);">
        <v-card-title class="pa-0">
          <v-spacer></v-spacer>
        </v-card-title>
        <v-layout row wrap justify-start align-start class="pa-0">
          <v-container fluid class="pa-1">
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
                  <h2 style="width: 100%">Coming up next<v-icon style="float: right" @click="sheet = false" class="clickable ma-2">close</v-icon></h2>
                  <div class="headline">{{ getTitle }}</div>
                  <div>{{ getUnder }}</div>
                  <v-layout row wrap>
                    <v-flex xs12 md6 class="text-xs-left">
                      <h5>From {{ plexserver.name }}</h5>
                    </v-flex>
                    <v-flex xs12 md6 class="text-xs-right">
                      <div class="text-xs-right">
                        <span>{{ (Math.round(timer / 1000) * 100) / 100 }}s</span>
                        <v-btn @click="pressPlay" color="primary">Play Now</v-btn>
                        <v-btn flat @click="sheet = false">Cancel</v-btn>
                      </div>
                    </v-flex>
                  </v-layout>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-layout>
        <div :style="{ width: percent + '%'}" class="primary" style="height: 3px"></div>
        <!-- <v-progress-linear :value="percent" class="pa-0 ma-0" height="3"></v-progress-linear> -->
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
      maxTimer: 15000,
      timer: 15000,
      cache: {},
      content: null,
      ready: false
    }
  },
  mounted: async function () {
    window.EventBus.$on('upnext', (data) => {
      console.log('Upnext event', data)
      this.content = data
      this.ready = true
      this.startTimer()
    })
  },
  watch: {

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
      this.timer = this.maxTimer
      let data = this.item
      this.sheet = true
      let ticker = setInterval(() => {
        console.log('tick')
        this.timer = this.timer - 30
        if (this.timer < 1) {
          if (this.sheet) {
            this.pressPlay(data.item)
          }
          clearInterval(ticker)
          this.sheet = false
        }
      }, 30)
    }
  },
  computed: {
    percent: function () {
      return (this.timer / this.maxTimer) * 100
    },
    background: function () {
      return this.plexserver.getUrlForLibraryLoc(this.item.art, 1000, 450)
    },
    plex: function () {
      return this.$store.getters.getPlex
    },
    plexserver: function () {
      if (!this.content) {
        return
      }
      return this.plex.servers[this.content.machineIdentifier]
    },
    thumb: function () {
      return this.plexserver.getUrlForLibraryLoc(this.item.thumb || this.item.art, 1000, 450)
    },
    item: function () {
      if (!this.content || this.content.loading) {
        return
      }
      return this.content.MediaContainer.Hub[0].Metadata[0]
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
