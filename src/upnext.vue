<template>
  <v-bottom-sheet value="true" persistent hide-overlay>
    <v-card style="max-width: 100%; margin-left: auto; margin-right: auto" class="white--text pa-0" :img="background">
      <v-container fluid align-center justify-start class="pa-0" style="background: rgba(0,0,0,0.7);">
        <v-card-title class="pa-0">
          <v-spacer></v-spacer>
        </v-card-title>
        <v-layout row wrap justify-start align-start class="pa-0">
          <v-container fluid class="pa-1">
            <v-layout row>
              <v-flex xs3 sm2>
                <v-img
                :src="thumb"
                  height="125px"
                  contain
                ></v-img>
              </v-flex>
              <v-flex>
                <div>
                  <h2 style="width: 100%">Coming up next<v-icon style="float: right" @click="cancelPressed" class="clickable ma-2">close</v-icon></h2>
                  <div class="headline">{{ title }}</div>
                  <div>{{ secondaryTitle }}</div>
                  <v-layout row wrap>
                    <v-flex xs12 md6 class="text-xs-left">
                      <h5>From {{ plexserver.name }}</h5>
                    </v-flex>
                    <v-flex xs12 md6 class="text-xs-right">
                      <div class="text-xs-right">
                        <v-btn @click="playPressed" color="primary">Play Now</v-btn>
                        <v-btn flat @click="cancelPressed">Cancel</v-btn>
                      </div>
                    </v-flex>
                  </v-layout>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-layout>

        <div class="c-timer">
          <div clas="c-timebar">
            <div class="c-timebar__background">
            </div>

            <div class="c-timebar__remaining primary" :style="transitionBarWithStyle">
            </div>
          </div>
        </div>

      </v-container>
    </v-card>
  </v-bottom-sheet>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

import plexutils from '@/utils/plexutils';

export default {
  data() {
    return {
      sheet: true,
      maxTimer: 15000,
      transitionBarWithStyle: {},
      timeoutId: null,
    };
  },

  mounted() {
    this.startTimer();
  },

  methods: {
    ...mapMutations([
      'SET_UP_NEXT_POST_PLAY_DATA',
    ]),

    playPressed() {
      this.cancelTimer();
      this.playMedia();
    },

    playMedia() {
      this.transitionBarWithStyle = {};

      this.getChosenClient.playMedia({
        key: this.item.key,
        mediaIndex: 0,
        server: this.plexserver,
        offset: 0,
      });

      this.SET_UP_NEXT_POST_PLAY_DATA(null);
    },

    startTimer() {
      this.timeoutId = setTimeout(() => {
        this.playMedia();
      }, this.maxTimer);

      this.transitionBarWithStyle = {
        animationDuration: `${this.maxTimer / 1000}s`,
        animationName: 'timebar_progress_x',
      };
    },

    cancelPressed() {
      this.cancelTimer();
      this.SET_UP_NEXT_POST_PLAY_DATA(null);
    },

    cancelTimer() {
      if (this.timeoutId > -1) {
        clearTimeout(this.timeoutId);
        this.transitionBarWithStyle = {};
      }
    },
  },

  computed: {
    ...mapGetters([
      'GET_UP_NEXT_POST_PLAY_DATA',
      'GET_PLEX_SERVER_ID',
      'getPlex',
      'getChosenClient',
    ]),

    background() {
      return this.plexserver.getUrlForLibraryLoc(this.item.art, 1000, 450);
    },

    plexserver() {
      return this.getPlex.servers[this.GET_PLEX_SERVER_ID];
    },

    thumb() {
      return this.plexserver.getUrlForLibraryLoc(this.item.thumb || this.item.art, 1000, 450);
    },

    item() {
      return this.GET_UP_NEXT_POST_PLAY_DATA.MediaContainer.Hub[0].Metadata[0];
    },

    title() {
      return plexutils.getTitle(this.item);
    },

    secondaryTitle() {
      return plexutils.getSecondaryTitle(this.item);
    },
  },
};
</script>


<style scoped>
.c-timer {
  height: 3px;
  position: relative;
}

.c-timebar{
    width: 100%;
    height: 100%;
    position: relative;
}

.c-timebar__background{
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
}

.c-timebar__remaining{
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index:2;
  transform-origin: 0 100%;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes timebar_progress_x{
  from  { transform: scaleX(1) }
  to    { transform: scaleX(0) }
}

@keyframes timebar_progress_y{
  from  { transform: scaleY(1) }
  to    { transform: scaleY(0) }
}
</style>
