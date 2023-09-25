<template>
  <v-bottom-sheet
    value="true"
    persistent
    hide-overlay
  >
    <v-card
      style="max-width: 100%; margin-left: auto; margin-right: auto;"
      class="white--text pa-0"
      :img="background"
    >
      <v-container
        fluid
        align-center
        justify="start"
        class="pa-0"
        style="background: rgb(0 0 0 / 70%);"
      >
        <v-row
          no-gutters

          justify="start"
          align="start"
          class="pa-0"
        >
          <v-col
            cols="3"
            sm="2"
            align-self="center"
          >
            <v-img
              :src="thumb"
              height="125px"
              contain
            />
          </v-col>

          <v-col>
            <v-container fluid>
              <v-row
                no-gutters
              >
                <v-col>
                  <h2>
                    Coming up next
                  </h2>

                  <div class="headline">
                    {{ getTitle(GET_UP_NEXT_POST_PLAY_DATA) }}
                  </div>

                  <div>{{ getSecondaryTitle(GET_UP_NEXT_POST_PLAY_DATA) }}</div>

                  <v-col
                    cols="12"
                    md="6"
                    class="text-xs-left text-subtitle-2 primary--text"
                  >
                    From {{ server.name }}
                  </v-col>
                </v-col>

                <v-col
                  cols="auto"
                  class="ml-auto d-flex flex-column justify-space-between"
                >
                  <v-btn
                    icon
                    class="align-self-end"
                    @click="cancelPressed"
                  >
                    <v-icon>close</v-icon>
                  </v-btn>

                  <div class="text-xs-right">
                    <v-btn
                      color="primary"
                      @click="playPressed"
                    >
                      Play Now
                    </v-btn>

                    <v-btn
                      @click="cancelPressed"
                    >
                      Cancel
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-col>
        </v-row>

        <div class="c-timer">
          <div clas="c-timebar">
            <div class="c-timebar__background" />

            <div
              class="c-timebar__remaining primary"
              :style="transitionBarWithStyle"
            />
          </div>
        </div>
      </v-container>
    </v-card>
  </v-bottom-sheet>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';

import contentTitle from '@/mixins/contentTitle';

export default {
  name: 'TheUpnextDialog',

  mixins: [contentTitle],

  data: () => ({
    sheet: true,
    transitionBarWithStyle: {},
    timeoutId: null,
  }),

  computed: {
    ...mapGetters([
      'GET_CONFIG',
      'GET_UP_NEXT_POST_PLAY_DATA',
    ]),

    ...mapGetters('plexservers', [
      'GET_PLEX_SERVER',
      'GET_MEDIA_IMAGE_URL',
    ]),

    background() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.GET_UP_NEXT_POST_PLAY_DATA.machineIdentifier,
        mediaUrl: this.GET_UP_NEXT_POST_PLAY_DATA.art,
        width: 1000,
        height: 450,
      });
    },

    server() {
      return this.GET_PLEX_SERVER(this.GET_UP_NEXT_POST_PLAY_DATA.machineIdentifier);
    },

    thumb() {
      return this.GET_MEDIA_IMAGE_URL({
        machineIdentifier: this.GET_UP_NEXT_POST_PLAY_DATA.machineIdentifier,
        mediaUrl: this.GET_UP_NEXT_POST_PLAY_DATA.thumb || this.GET_UP_NEXT_POST_PLAY_DATA.art,
        width: 1000,
        height: 450,
      });
    },
  },

  mounted() {
    this.startTimer();
  },

  beforeDestroy() {
    this.cancelTimer();
  },

  methods: {
    ...mapActions('plexclients', [
      'PLAY_NEXT',
    ]),

    ...mapMutations([
      'SET_UP_NEXT_POST_PLAY_DATA',
    ]),

    playPressed() {
      this.cancelTimer();
      this.playMedia();
    },

    async playMedia() {
      this.transitionBarWithStyle = {};
      const metadata = this.GET_UP_NEXT_POST_PLAY_DATA;
      this.SET_UP_NEXT_POST_PLAY_DATA(null);
      try {
        await this.PLAY_NEXT(metadata);
      } catch (e) {
        if (e.code === 7000) {
          console.debug('Player initialization aborted');
        } else {
          throw e;
        }
      }
    },

    startTimer() {
      this.timeoutId = setTimeout(() => {
        this.playMedia();
      }, this.GET_CONFIG.synclounge_upnext_popup_lifetime);

      this.transitionBarWithStyle = {
        animationDuration: `${this.GET_CONFIG.synclounge_upnext_popup_lifetime / 1000}s`,
        animationName: 'timebar_progress_x',
      };
    },

    cancelPressed() {
      this.cancelTimer();
      this.SET_UP_NEXT_POST_PLAY_DATA(null);
    },

    cancelTimer() {
      if (this.timeoutId != null) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
        this.transitionBarWithStyle = {};
      }
    },
  },
};
</script>

<style scoped>
.c-timer {
  height: 3px;
  position: relative;
}

.c-timebar {
  width: 100%;
  height: 100%;
  position: relative;
}

.c-timebar__background {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
}

.c-timebar__remaining {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  transform-origin: 0 100%;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
</style>

<style>
@keyframes timebar_progress_x {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@keyframes timebar_progress_y {
  from { transform: scaleY(1); }
  to { transform: scaleY(0); }
}
</style>
