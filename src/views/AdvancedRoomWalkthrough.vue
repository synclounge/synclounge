<template>
  <v-row justify="center">
    <v-col
      lg="8"
      style="background: rgb(0 0 0 / 10%); border-radius: 10px;"
      class="pa-4"
    >
      <v-row justify="center">
        <v-col
          md="8"
          lg="4"
        >
          <img
            style="width: 100%;"
            src="@/assets/images/logos/logo-long-light.png"
          >
        </v-col>
      </v-row>

      <v-stepper
        v-model="e1"
        style="background: rgb(0 0 0 / 30%); color: white !important; border-radius: 20px;"
        class="ma-4"
      >
        <v-stepper-header>
          <v-stepper-step
            step="1"
            :complete="true"
          >
            Select a client
          </v-stepper-step>

          <v-divider />

          <v-stepper-step
            step="2"
            :complete="false"
          >
            Join a server
          </v-stepper-step>

          <v-divider />

          <v-stepper-step step="3">
            Sync
          </v-stepper-step>
        </v-stepper-header>
      </v-stepper>

      <div>
        <v-row class="ml-4">
          <v-col class="pb-0">
            <h2>Choose your Plex player</h2>
          </v-col>
        </v-row>

        <v-row class="ml-4">
          <v-col
            class="pt-0"
          >
            Choose a client from the list below. Once you've found the client you would like to
            use, click the connect button. SyncLounge will test to see if it can connect with the
            client and will let you know if it cannot.
          </v-col>
        </v-row>

        <div
          v-if="!areDevicesCached"
          class="text-center pa-4"
        >
          <v-progress-circular
            indeterminate
            color="primary"
          />
        </div>

        <v-row
          v-else
          justify="center"
          class="ml-4 mr-4"
        >
          <v-col
            v-if="!doReverse"
            md="6"
            lg="6"
          >
            <v-subheader>
              Plex Players
              <v-icon
                class="pl-2"
                small
                @click="FETCH_PLEX_DEVICES"
              >
                refresh
              </v-icon>
            </v-subheader>

            <v-list
              dense
              style="background: none;"
            >
              <v-list-item-group
                v-model="previewClientId"
              >
                <PlexClient
                  v-for="id in GET_PLEX_CLIENT_IDS_SORTED_BY_LAST_SEEN"
                  :key="id"
                  :value="id"
                  :client-id="id"
                />
              </v-list-item-group>
            </v-list>
          </v-col>

          <v-col
            md="6"
            lg="6"
          >
            <div
              v-if="previewClientId"
              class="pa-2"
            >
              <v-subheader>Selected Player</v-subheader>
              <v-row>
                <v-col
                  md="3"
                  class="text-center"
                  style="position: relative;"
                >
                  <img
                    :src="url"
                    style="height: 100px; width: auto; vertical-align: middle;"
                  >
                </v-col>

                <v-col md="9">
                  <div class="selected-player-details pl-1">
                    <h3>{{ previewClient.name }}</h3>

                    <div>
                      <label>Last seen</label>
                      <span style="opacity: 0.8;">{{ lastSeenAgo(previewClient.lastSeenAt) }}</span>
                    </div>

                    <div>
                      <label>Device</label>
                      <span style="opacity: 0.8;">{{ previewClient.device }}</span>
                    </div>

                    <div>
                      <label>Running</label>
                      <span style="opacity: 0.8;">{{ previewClient.product }}</span>
                    </div>

                    <div class="pb-2">
                      <label>Platform</label>
                      <span style="opacity: 0.8;">{{ previewClient.platform }}</span>
                    </div>

                    <div
                      v-if="previewClientErrorMsg"
                      class="red--text text--lighten-1"
                    >
                      {{ previewClientErrorMsg }}
                    </div>
                  </div>
                </v-col>
              </v-row>

              <v-row class="pt-2">
                <v-col>
                  <div v-if="gotResponse">
                    <v-btn
                      v-if="previewClient.chosenConnection"
                      block
                      color="primary"
                      @click="chooseClient"
                    >
                      Connect
                    </v-btn>

                    <v-btn
                      v-else
                      block
                      color="primary"
                      @click="findPreviewConnection"
                    >
                      Try again
                    </v-btn>
                  </div>

                  <div
                    v-else
                    class="center spinner-orange"
                  >
                    <div style="width: 100%; text-align: center;">
                      <v-progress-circular
                        indeterminate
                        :size="50"
                        class="amber--text"
                        style="display: inline-block;"
                      />
                    </div>
                  </div>

                  <div
                    v-if="previewClient.product.indexOf('Web') > -1"
                    class="warning--text"
                  >
                    Note: Plex Web is currently not supported.
                  </div>

                  <div
                    v-if="previewClient.product.indexOf('Plex for Android') > -1"
                    class="warning--text"
                  >
                    Note: Plex for Android applications may not work properly. See "What clients are
                    supported?" in the
                    <a href="https://docs.synclounge.tv/faq/">FAQ</a> for more details.
                  </div>

                  <div
                    v-if="previewClient.product.indexOf('Plex for Windows') > -1"
                    class="warning--text"
                  >
                    Note: Plex Desktop applications may not work properly. See "What clients are
                    supported?" in the
                    <a href="https://docs.synclounge.tv/faq/">FAQ</a> for more details.
                  </div>

                  <div
                    v-if="isHttps && previewClient.clientIdentifier !== slPlayerClientId"
                    class="warning--text"
                  >
                    Note: You may not be able to connect to external Plex Clients while loading the
                    page via HTTPS. Click
                    <a :href="nohttpslink">here</a> to load the page via HTTP. See "My client isn't
                    working!" in the <a href="https://docs.synclounge.tv/faq/">FAQ</a> for more
                    details.
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>

          <v-col
            v-if="doReverse"
            md="6"
            lg="7"
          >
            <v-subheader>Plex Players</v-subheader>

            <v-list
              dense
              style="background: none;"
              :value="GET_CHOSEN_CLIENT_ID"
            >
              <v-list-item-group
                v-model="previewClientId"
              >
                <PlexClient
                  v-for="id in GET_PLEX_CLIENT_IDS_SORTED_BY_LAST_SEEN"
                  :key="id"
                  :value="id"
                  :client-id="id"
                />
              </v-list-item-group>
            </v-list>
          </v-col>
        </v-row>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';
import plexPlatformMap from '@/utils/plexplatformmap';
import { slPlayerClientId } from '@/player/constants';

export default {
  name: 'AdvancedRoomWalkthrough',

  components: {
    PlexClient: () => import('@/components/PlexClient.vue'),
  },

  data: () => ({
    previewClientErrorMsg: null,
    gotResponse: true,
    e1: '1',
    joinRoomModal: false,
    previewClientId: null,
    abortController: null,
  }),

  computed: {
    ...mapGetters('plexclients', [
      'GET_PLEX_CLIENT_IDS_SORTED_BY_LAST_SEEN',
      'GET_CHOSEN_CLIENT_ID',
      'GET_PLEX_CLIENT',
    ]),

    ...mapState('plex', [
      'areDevicesCached',
    ]),

    slPlayerClientId() {
      return slPlayerClientId;
    },

    doReverse() {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs':
          return true;
        case 'sm':
          return true;
        default:
          return false;
      }
    },

    isHttps() {
      return window.location.protocol === 'https:';
    },

    previewClient() {
      return this.GET_PLEX_CLIENT(this.previewClientId);
    },

    platform() {
      return (
        plexPlatformMap[this.previewClient.platform.toLowerCase()]
        || plexPlatformMap[this.previewClient.product.toLowerCase()]
      );
    },

    url() {
      if (this.platform) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        return require(`@/assets/images/platforms/${this.platform}.svg`);
      }

      // eslint-disable-next-line global-require
      return require('@/assets/images/platforms/plex.svg');
    },

    nohttpslink() {
      return `http:${window.location.href.substring(window.location.protocol.length)}`;
    },
  },

  watch: {
    async previewClientId() {
      await this.findPreviewConnection();
    },
  },

  beforeDestroy() {
    this.cancelRequests();
  },

  methods: {
    ...mapActions('plexclients', [
      'FIND_AND_SET_CONNECTION',
    ]),

    ...mapActions('plex', [
      'FETCH_PLEX_DEVICES',
    ]),

    ...mapMutations('plexclients', [
      'SET_CHOSEN_CLIENT_ID',
    ]),

    cancelRequests() {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    },

    async findPreviewConnection() {
      this.cancelRequests();
      const controller = new AbortController();
      this.abortController = controller;
      this.previewClientErrorMsg = null;
      this.gotResponse = false;

      try {
        await this.FIND_AND_SET_CONNECTION({
          clientIdentifier: this.previewClientId,
          signal: controller.signal,
        });
      } catch (e) {
        if (controller.signal.aborted) {
          // If we aborted, ignore errors and return immediately
          return;
        }
        console.error(e);
        this.previewClientErrorMsg = 'Unable to connect to client';
      }

      this.gotResponse = true;
    },

    async chooseClient() {
      this.SET_CHOSEN_CLIENT_ID(this.previewClientId);
      this.$router.push({ name: 'AdvancedRoomJoin' });
    },

    lastSeenAgo(clientTime) {
      return `${formatDistanceToNow(parseISO(clientTime))} ago`;
    },
  },
};
</script>

<style scoped>
.selected-player-details label + span {
  margin-left: 5px;
}
</style>
