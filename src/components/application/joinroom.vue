<template>
  <v-layout
    row
    wrap
    justify-center
  >
    <v-flex
      xs12
      lg10
      style="background: rgba(0,0,0,0.1); border-radius: 10px"
      class="pa-4"
    >
      <v-layout
        row
        wrap
        justify-center
      >
        <v-flex
          xs12
          md8
          lg4
          xl6
        >
          <img
            style="width:100%"
            :src="getLogos.light.long"
          >
        </v-flex>
      </v-layout>
      <v-stepper
        v-model="e1"
        style="background: rgba(0,0,0,0.3); border-radius: 20px"
        dark
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
            Join a room
          </v-stepper-step>
          <v-divider />
          <v-stepper-step step="3">
            Sync
          </v-stepper-step>
        </v-stepper-header>
      </v-stepper>
      <v-layout
        row
        wrap
        justify-center
      >
        <v-flex
          xs12
          class="ml-4"
        >
          <h2 class="text-xs-left">
            Connect to a SyncLounge room
          </h2>
        </v-flex>
        <v-flex
          xs12
          class="ml-4"
        >
          <p>
            It's time to connect to SyncLounge. From the list select a server which is closest to
            your location. Once you've chosen one that works for you it's time to create a room for
            your friends to join. If the room does not exist it will be created for you.
          </p>
        </v-flex>
        <v-flex
          v-if="!getConnected && GET_RECENT_ROOMS.length > 0"
          xs12
          class="nicelist pa-4"
          style="color:white !important;"
        >
          <v-subheader>Recent Rooms</v-subheader>
          <v-list class="pa-0">
            <template v-for="(item, index) in GET_RECENT_ROOMS.slice(0, 3)">
              <v-list-item
                :key="index"
                @click="recentConnect(item)"
              >
                <v-list-item-avatar>
                  <img
                    :src="getLogos.light.small"
                    style="width: 32px; height: auto"
                  >
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ item.name || item.server || 'Custom' }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <b>{{ item.room }}</b>
                    <span style="opacity: 0.5; float: right">{{ sinceNow(item.time) }}</span>
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-tooltip
                    top
                    color="light-blue darken-4"
                  >
                    <v-icon
                      color="white"
                      dark
                      @click.stop="REMOVE_RECENT_ROOM(item)"
                    >
                      close
                    </v-icon>
                    >Remove
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>
            </template>
          </v-list>
        </v-flex>
        <v-flex
          v-if="!getConnected"
          xs12
          class="nicelist pa-4"
          style="color:white !important"
        >
          <v-subheader>Select a server</v-subheader>
          <v-layout
            row
            wrap
            justify-center
            align-center
          >
            <v-flex
              v-for="server in GET_SYNCLOUNGE_SERVERS"
              :key="server.url"
              pa-2
              xs12
              md3
              lg2
            >
              <v-card
                height="300px"
                style="border-radius: 20px"
              >
                <v-layout
                  row
                  wrap
                  justify-start
                  align-center
                  style="height: 100%"
                >
                  <v-flex
                    xs12
                    class="text-center pa-2"
                    style="height: 80px"
                  >
                    <img
                      :src="server.image"
                      class="server-image"
                    >
                  </v-flex>
                  <v-flex
                    xs12
                    class="text-center"
                  >
                    <h2>{{ server.name }}</h2>
                    <h4>{{ server.location }}</h4>
                  </v-flex>
                  <v-flex
                    v-if="server.url !== 'custom'"
                    xs12
                    class="text-center"
                  >
                    <div v-if="results[server.url]">
                      <div v-if="results[server.url].alive">
                        Ping:
                        <span
                          class="thick--text"
                          :class="connectionQualityClass(results[server.url].latency)"
                        >{{ results[server.url].latency }}ms</span>
                      </div>
                      <div
                        v-else
                        class="text-center red--text"
                      >
                        error
                      </div>
                    </div>
                  </v-flex>
                  <v-flex
                    xs12
                    class="text-center"
                  >
                    <div v-if="server.url !== 'custom'">
                      <div v-if="results[server.url]">
                        <div v-if="results[server.url].alive">
                          <div>
                            Load:
                            <span
                              class="thick--text"
                              :class="loadQualityClass(results[server.url].result)"
                            >{{ results[server.url].result || 'Unknown' }}</span>
                          </div>
                        </div>
                        <div
                          v-else
                          class="text-center red--text"
                        >
                          error
                        </div>
                      </div>
                    </div>
                  </v-flex>

                  <v-flex
                    xs12
                    class="text-center pt-1 mt-4"
                  >
                    <v-btn
                      color="primary"
                      :disabled="connectionPending"
                      class="connect-button"
                      @click="serverSelected(server)"
                    >
                      Connect
                    </v-btn>
                  </v-flex>
                </v-layout>
              </v-card>
            </v-flex>
          </v-layout>
          <v-text-field
            v-if="selectedServer.url == 'custom'"
            name="input-2"
            label="Custom Server"
            :value="GET_CUSTOM_SERVER_USER_INPUTTED_URL"
            class="input-group pt-input"
            @change="SET_CUSTOM_SERVER_USER_INPUTTED_URL"
          />
          <v-layout
            v-if="selectedServer.url == 'custom'"
            row
            wrap
          >
            <v-flex xs12>
              <v-btn
                class="pt-orange white--text pa-0 ma-0"
                color="primary"
                primary
                style="width:100%"
                @click.native="attemptConnectCustom()"
              >
                Connect
              </v-btn>
            </v-flex>
          </v-layout>
          <v-layout
            v-if="connectionPending && !serverError"
            row
            wrap
            class="pt-3"
          >
            <v-flex xs12>
              <div style="width:100%;text-align:center">
                <v-progress-circular
                  indeterminate
                  :size="50"
                  class="amber--text"
                  style="display:inline-block"
                />
              </div>
            </v-flex>
          </v-layout>
          <v-layout
            v-if="serverError"
            class="pt-3 text-center"
            row
            wrap
          >
            <v-flex
              xs12
              class="red--text"
            >
              <v-icon class="red--text">
                info
              </v-icon>
              {{ serverError }}
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex
          v-if="getConnected"
          xs12
          class="text-center"
        >
          <v-layout
            row
            wrap
          >
            <v-flex
              xs12
              md6
              offset-md3
            >
              <v-text-field
                v-model="room"
                origin="center center"
                :maxlength="25"
                name="input-2"
                label="Room name"
                :autofocus="true"
                @keyup.enter.native="joinRoom()"
              />
            </v-flex>
            <v-flex
              xs12
              md6
              offset-md3
            >
              <v-text-field
                v-model="password"
                transition="v-scale-transition"
                origin="center center"
                name="input-2"
                label="Room password"
                @keyup.enter.native="joinRoom()"
              />
            </v-flex>
            <v-flex
              xs12
              md6
              offset-md3
            >
              <v-btn
                block
                color="primary"
                @click.native="joinRoom()"
              >
                Join
              </v-btn>
            </v-flex>
            <v-layout
              v-if="roomError"
              class="pt-3 text-center"
              row
              wrap
            >
              <v-flex
                xs12
                class="red--text"
              >
                <v-icon class="red--text">
                  info
                </v-icon>
                {{ roomError }}
              </v-flex>
            </v-layout>
          </v-layout>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script>
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
  name: 'Joinroom',

  data() {
    return {
      selectedServer: '',
      serverError: null,
      roomError: null,
      room: '',
      e1: 2,
      password: '',
      connectionPending: false,
      thisServer: window.location.origin,
      recents: null,

      results: {},

      testConnectionInterval: null,
    };
  },

  computed: {
    ...mapGetters([
      'GET_SYNCLOUNGE_SERVERS',
      'getConnected',
      'getPlex',
      'getServer',
      'getConnected',
      'getRoom',
      'getLogos',
      'GET_PLEX_USER',
    ]),

    ...mapGetters('settings', [
      'GET_CUSTOM_SERVER_USER_INPUTTED_URL',
      'GET_RECENT_ROOMS',
    ]),
  },

  watch: {
    selectedServer() {
      // this.attemptConnect()
      this.serverError = null;
    },

    getRoom() {
      if (this.getServer && this.getRoom) {
        this.$router.push('/browse');
      }
    },
  },

  mounted() {
    this.testConnectionInterval = setInterval(() => {
      this.testConnections();
    }, 5000);
  },

  beforeDestroy() {
    clearInterval(this.testConnectionInterval);
    this.destroyed = true;
  },

  created() {
    if (this.getRoom && this.getConnected && this.getServer) {
      this.$router.push('/browse');
    }
  },

  methods: {
    ...mapMutations('settings', ['SET_CUSTOM_SERVER_USER_INPUTTED_URL']),
    ...mapActions('settings', ['REMOVE_RECENT_ROOM']),
    ...mapActions(['socketConnect']),

    sinceNow(x) {
      return formatDistanceToNow(x);
    },

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

    serverSelected(server) {
      this.selectedServer = server;
      if (this.selectedServer.defaultRoom) {
        this.room = this.selectedServer.defaultRoom;

        if (this.selectedServer.defaultPassword) {
          this.password = this.selectedServer.defaultPassword;
        }
      }
      if (this.selectedServer.url !== 'custom') {
        this.attemptConnect();
      }
    },

    async testConnections() {
      this.GET_SYNCLOUNGE_SERVERS.forEach((server) => {
        if (server.url !== 'custom') {
          const start = new Date().getTime();
          axios
            .get(`${server.url}/health`)
            .then((res) => {
              Vue.set(this.results, server.url, {
                alive: true,
                latency: Math.abs(start - new Date().getTime()),
                result: res.data.load || null,
              });
            })
            .catch(() => {
              Vue.set(this.results, server.url, {
                alive: false,
                latency: Math.abs(start - new Date().getTime()),
                result: null,
              });
            });
        }
      });
    },

    attemptConnect() {
      // Attempt the connection
      return new Promise((resolve, reject) => {
        this.serverError = null;
        if (this.selectedServer.url !== 'custom') {
          this.connectionPending = true;
          this.socketConnect({ address: this.selectedServer.url })
            .then((result) => {
              this.connectionPending = false;
              if (result) {
                if (this.room) {
                  this.joinRoom()
                    .catch(() => {});
                }
                resolve();
              } else {
                this.serverError = null;
                reject(result);
              }
            })
            .catch((e) => {
              this.connectionPending = false;
              this.serverError = `Failed to connect to ${this.selectedServer.url}`;
              reject(e);
            });
        } else {
          reject(new Error('Custom error: wrong function'));
        }
      });
    },

    attemptConnectCustom() {
      this.connectionPending = true;
      this.serverError = null;
      this.$store
        .dispatch('socketConnect', { address: this.GET_CUSTOM_SERVER_USER_INPUTTED_URL })
        .then((result) => {
          this.connectionPending = false;
          if (result) {
            this.serverError = `Failed to connect to ${this.GET_CUSTOM_SERVER_USER_INPUTTED_URL}`;
          } else {
            this.serverError = null;
          }
        })
        .catch(() => {
          this.connectionPending = false;
          this.serverError = `Failed to connect to ${this.GET_CUSTOM_SERVER_USER_INPUTTED_URL}`;
        });
    },

    async recentConnect(recent) {
      console.log('Attempting to connect to', recent);
      this.selectedServer = {
        url: recent.server,
      };
      this.room = recent.room;
      this.password = recent.password;
      await this.attemptConnect();
    },

    async joinRoom() {
      if (!this.getConnected) {
        throw new Error('not connected to a server');
      }
      if (this.room === '' || this.room == null) {
        this.roomError = 'You must enter a room name!';
        throw new Error('no room specified');
      }
      try {
        await this.$store.dispatch('joinRoom', {
          user: this.GET_PLEX_USER,
          roomName: this.room,
          password: this.password,
        });
      } catch (e) {
        this.roomError = e;
        throw e;
      }
    },
  },
};
</script>

<style scope>
.server-image {
  max-height: 100%;
  vertical-align: middle;
  max-width: 80%;
  border-radius: 7px;
}

.connect-button {
  width: 80%;
  border-radius: 7px;
  margin: auto;
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
}
</style>
