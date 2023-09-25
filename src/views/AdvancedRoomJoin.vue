<template>
  <v-row
    justify="center"
  >
    <v-col
      cols="12"
      lg="10"
      style="background: rgb(0 0 0 / 10%); border-radius: 10px;"
      class="pa-4"
    >
      <v-row
        justify="center"
      >
        <v-col
          cols="12"
          md="8"
          lg="4"
          xl="6"
        >
          <v-img
            src="@/assets/images/logos/logo-long-light.png"
          />
        </v-col>
      </v-row>

      <v-stepper
        v-model="e1"
        style="background: rgb(0 0 0 / 30%);"
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

      <v-row
        justify="center"
      >
        <v-col
          cols="12"
          class="pa-4"
        >
          <v-subheader>Select a server</v-subheader>

          <v-row
            justify="center"
            align="center"
          >
            <v-col
              v-for="server in GET_CONFIG.servers"
              :key="server.url"
              cols="12"
              md="3"
              lg="2"
            >
              <v-card>
                <v-img
                  height="125"
                  :src="server.image"
                  class="white--text align-end"
                  gradient="to bottom, rgba(0,0,0,.6), rgba(0,0,0,.9)"
                >
                  <v-card-title v-text="server.name" />
                  <v-card-subtitle v-text="server.location" />
                </v-img>

                <v-card-text>
                  <template v-if="GET_SERVER_HEALTH(server.url)">
                    <div>
                      Ping:
                      <span
                        class="font-weight-bold"
                        :class="connectionQualityClass(GET_SERVER_HEALTH(server.url).latency)"
                      >
                        {{ GET_SERVER_HEALTH(server.url).latency }}ms
                      </span>
                    </div>

                    <div>
                      Load:
                      <span
                        class="font-weight-bold"
                        :class="loadQualityClass(GET_SERVER_HEALTH(server.url).load)"
                      >
                        {{ GET_SERVER_HEALTH(server.url).load }}
                      </span>
                    </div>
                  </template>

                  <div
                    v-else
                    class="text-center red--text"
                  >
                    error
                  </div>
                </v-card-text>

                <v-card-actions>
                  <v-btn
                    block
                    color="primary"
                    :disabled="connectionPending"
                    @click="connect(server.url)"
                  >
                    Connect
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col
              class="pa-2"
              cols="12"
              md="3"
              lg="2"
            >
              <v-card>
                <v-img
                  height="125"
                  src="@/assets/images/synclounge-white.png"
                  class="white--text align-end"
                  gradient="to bottom, rgba(0,0,0,.6), rgba(0,0,0,.9)"
                >
                  <v-card-title>
                    Custom
                  </v-card-title>
                </v-img>

                <v-card-text>
                  <v-text-field
                    hide-details
                    :value="customServerUrl"
                    @change="SET_CUSTOM_SERVER_URL"
                  />
                </v-card-text>

                <v-card-actions>
                  <v-btn
                    block
                    color="primary"
                    :disabled="connectionPending"
                    @click="connect(customServerUrl)"
                  >
                    Connect
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>

          <v-row
            v-if="connectionPending && !serverError"
            class="pt-3"
          >
            <v-col cols="12">
              <div style="width: 100%; text-align: center;">
                <v-progress-circular
                  indeterminate
                  :size="50"
                  class="amber--text"
                  style="display: inline-block;"
                />
              </div>
            </v-col>
          </v-row>

          <v-row
            v-if="serverError"
            class="pt-3 text-center"
          >
            <v-col
              cols="12"
              class="red--text"
            >
              <v-icon class="red--text">
                info
              </v-icon>
              {{ serverError }}
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';
import { getRandomRoomId } from '@/utils/random';
import redirection from '@/mixins/redirection';
import linkWithRoom from '@/mixins/linkwithroom';
import { slPlayerClientId } from '@/player/constants';

export default {
  name: 'AdvancedRoomJoin',

  mixins: [
    redirection,
    linkWithRoom,
  ],

  data: () => ({
    serverError: null,
    e1: 2,
    connectionPending: false,
    testConnectionInterval: null,
  }),

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_MEDIA_METADATA',
    ]),

    ...mapGetters('synclounge', [
      'GET_SERVER_HEALTH',
    ]),

    ...mapState('settings', [
      'customServerUrl',
    ]),
  },

  beforeDestroy() {
    clearInterval(this.testConnectionInterval);
  },

  async created() {
    await this.FETCH_SERVERS_HEALTH();

    // TODO: rewrite this with a generator
    this.testConnectionInterval = setInterval(
      () => this.FETCH_SERVERS_HEALTH(),
      5000,
    );
  },

  methods: {
    ...mapMutations('settings', [
      'SET_CUSTOM_SERVER_URL',
    ]),

    ...mapActions('synclounge', [
      'FETCH_SERVERS_HEALTH',
      'SET_AND_CONNECT_AND_JOIN_ROOM',
      'DISCONNECT_IF_CONNECTED',
    ]),

    connectionQualityClass(value) {
      if (value < 50) {
        return ['green--text', 'text--lighten-1'];
      }
      if (value < 150) {
        return ['lime--text'];
      }
      if (value < 250) {
        return ['orange--text'];
      }
      return ['red--text'];
    },

    loadQualityClass(value) {
      if (value === 'low') {
        return ['green--text', 'text--lighten-1'];
      }
      if (value === 'medium') {
        return ['orange--text'];
      }
      if (value === 'high') {
        return ['red--text'];
      }
      return ['white--text'];
    },

    async connect(server) {
      this.serverError = null;
      this.connectionPending = true;

      try {
        await this.SET_AND_CONNECT_AND_JOIN_ROOM({
          server,
          room: getRandomRoomId(),
        });

        if (this.$route.name === 'AdvancedRoomJoin') {
          if (this.GET_CHOSEN_CLIENT_ID === slPlayerClientId || !this.GET_ACTIVE_MEDIA_METADATA) {
            this.$router.push(this.linkWithRoom({ name: 'PlexHome' }));
          } else {
            this.redirectToMediaPage();
          }
        }
      } catch (e) {
        this.DISCONNECT_IF_CONNECTED();
        console.error(e);
        this.serverError = e.message;
      }

      this.connectionPending = false;
    },
  },
};
</script>
