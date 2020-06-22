<template>
  <v-row
    justify="center"
  >
    <v-col
      cols="12"
      lg="10"
      style="background: rgba(0,0,0,0.1); border-radius: 10px"
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
            :src="getLogos.light.long"
          />
        </v-col>
      </v-row>

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

      <v-row
        justify="center"
      >
        <v-col
          cols="12"
          class="ml-4"
        >
          <h2 class="text-xs-left">
            Connect to a SyncLounge room
          </h2>
        </v-col>

        <v-col
          cols="12"
          class="ml-4"
        >
          <p>
            It's time to connect to SyncLounge. From the list select a server which is closest to
            your location. Once you've chosen one that works for you it's time to create a room for
            your friends to join. If the room does not exist it will be created for you.
          </p>
        </v-col>

        <v-col
          v-if="!GET_SOCKET && GET_RECENT_ROOMS.length > 0"
          cols="12"
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
                <v-list-item-avatar
                  width="32px"
                >
                  <v-img
                    :src="getLogos.light.small"
                  />
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
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon
                        color="white"
                        v-bind="attrs"
                        v-on="on"
                        @click="REMOVE_RECENT_ROOM(item)"
                      >
                        close
                      </v-icon>
                    </template>
                    Remove
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>
            </template>
          </v-list>
        </v-col>

        <v-col
          v-if="!GET_SOCKET"
          cols="12"
          class="nicelist pa-4"
          style="color:white !important"
        >
          <v-subheader>Select a server</v-subheader>

          <v-row
            justify="center"
            align="center"
          >
            <v-col
              v-for="server in GET_SYNCLOUNGE_SERVERS"
              :key="server.url"
              class="pa-2"
              cols="12"
              md="3"
              lg="2"
            >
              <v-card
                height="300px"
                style="border-radius: 20px"
              >
                <v-row
                  justify="center"
                  align="center"
                  style="height: 100%"
                >
                  <v-col
                    cols="12"
                    class="text-center pa-2"
                    style="height: 80px"
                  >
                    <img
                      :src="server.image"
                      class="server-image"
                    >
                  </v-col>

                  <v-col
                    cols="12"
                    class="text-center"
                  >
                    <h2>{{ server.name }}</h2>
                    <h4>{{ server.location }}</h4>
                  </v-col>

                  <v-col
                    v-if="server.url !== 'custom'"
                    cols="12"
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
                  </v-col>

                  <v-col
                    cols="12"
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
                  </v-col>

                  <v-col
                    cols="12"
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
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <template v-if="selectedServer && selectedServer.url === 'custom'">
            <v-text-field
              name="input-2"
              label="Custom Server"
              :value="GET_CUSTOM_SERVER_USER_INPUTTED_URL"
              class="input-group pt-input"
              @change="SET_CUSTOM_SERVER_USER_INPUTTED_URL"
            />

            <v-row>
              <v-col cols="12">
                <v-btn
                  class="pt-orange white--text pa-0 ma-0"
                  color="primary"
                  primary
                  style="width:100%"
                  @click="attemptConnectCustom"
                >
                  Connect
                </v-btn>
              </v-col>
            </v-row>
          </template>

          <v-row
            v-if="connectionPending && !serverError"
            class="pt-3"
          >
            <v-col cols="12">
              <div style="width:100%;text-align:center">
                <v-progress-circular
                  indeterminate
                  :size="50"
                  class="amber--text"
                  style="display:inline-block"
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

        <v-col
          v-if="GET_SOCKET"
          cols="12"
          class="text-center"
        >
          <v-row>
            <v-col
              cols="12"
              md="6"
              class="offset-md3"
            >
              <v-text-field
                v-model="room"
                origin="center center"
                :maxlength="25"
                name="input-2"
                label="Room name"
                :autofocus="true"
                @keyup.enter.native="joinRoom"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="offset-md3"
            >
              <v-text-field
                v-model="password"
                transition="v-scale-transition"
                origin="center center"
                name="input-2"
                label="Room password"
                @keyup.enter.native="joinRoom"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="offset-md3"
            >
              <v-btn
                block
                color="primary"
                @click="joinRoom"
              >
                Join
              </v-btn>
            </v-col>

            <v-row
              v-if="roomError"
              class="pt-3 text-center"
            >
              <v-col
                cols="12"
                class="red--text"
              >
                <v-icon class="red--text">
                  info
                </v-icon>
                {{ roomError }}
              </v-col>
            </v-row>
          </v-row>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
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
      selectedServer: null,
      serverError: null,
      roomError: null,
      room: '',
      e1: 2,
      password: '',
      connectionPending: false,
      results: {},
      testConnectionInterval: null,
    };
  },

  computed: {
    ...mapGetters('synclounge', [
      'GET_SOCKET',
      'GET_SYNCLOUNGE_SERVERS',
      'GET_ROOM',
      'GET_SERVER',
      'GET_RECENT_ROOMS',
    ]),

    ...mapGetters([
      'getLogos',
    ]),

    ...mapGetters('settings', [
      'GET_CUSTOM_SERVER_USER_INPUTTED_URL',
    ]),
  },

  watch: {
    selectedServer() {
      this.serverError = null;
    },

    GET_ROOM() {
      if (this.GET_SERVER && this.GET_ROOM) {
        this.$router.push('/browse');
      }
    },
  },

  beforeDestroy() {
    clearInterval(this.testConnectionInterval);
    this.destroyed = true;
  },

  created() {
    if (this.GET_ROOM && this.GET_SOCKET && this.GET_SERVER) {
      this.$router.push('/browse');
    } else {
      this.testConnectionInterval = setInterval(() => {
        this.testConnections();
      }, 5000);
    }
  },

  methods: {
    ...mapMutations('settings', ['SET_CUSTOM_SERVER_USER_INPUTTED_URL']),

    ...mapActions('synclounge', [
      'JOIN_ROOM',
      'ESTABLISH_SOCKET_CONNECTION',
      'REMOVE_RECENT_ROOM',
    ]),

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

    async serverSelected(server) {
      this.selectedServer = server;
      if (this.selectedServer.defaultRoom) {
        this.room = this.selectedServer.defaultRoom;

        if (this.selectedServer.defaultPassword) {
          this.password = this.selectedServer.defaultPassword;
        }
      }
      if (this.selectedServer.url !== 'custom') {
        await this.attemptConnect();
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

    async attemptConnect() {
      this.serverError = null;

      if (this.selectedServer.url !== 'custom') {
        this.connectionPending = true;

        try {
          await this.ESTABLISH_SOCKET_CONNECTION(this.selectedServer.url);

          if (this.room) {
            await this.joinRoom()
              .catch(() => {});
          }

          this.connectionPending = false;
        } catch (e) {
          this.connectionPending = false;
          this.serverError = `Failed to connect to ${this.selectedServer.url}`;
          console.error(e);
          throw e;
        }
      }
    },

    async attemptConnectCustom() {
      this.connectionPending = true;
      this.serverError = null;

      try {
        const result = await this.ESTABLISH_SOCKET_CONNECTION(
          this.GET_CUSTOM_SERVER_USER_INPUTTED_URL,
        );

        if (result) {
          this.serverError = `Failed to connect to ${this.GET_CUSTOM_SERVER_USER_INPUTTED_URL}`;
        } else {
          this.serverError = null;
        }
      } catch {
        this.serverError = `Failed to connect to ${this.GET_CUSTOM_SERVER_USER_INPUTTED_URL}`;
      }

      this.connectionPending = false;
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
      if (!this.GET_SOCKET) {
        throw new Error('not connected to a server');
      }

      if (this.room === '' || this.room == null) {
        this.roomError = 'You must enter a room name!';
        throw new Error('no room specified');
      }

      try {
        await this.JOIN_ROOM({
          room: this.room,
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
