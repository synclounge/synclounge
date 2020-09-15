<template>
  <v-row
    justify="center"
  >
    <v-col
      cols="12"
      lg="10"
      style="background: rgba(0, 0, 0, 0.1); border-radius: 10px;"
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
        style="background: rgba(0, 0, 0, 0.3); border-radius: 20px;"
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
          v-if="!GET_SOCKET_ID && GET_RECENT_ROOMS.length > 0"
          cols="12"
          class="nicelist pa-4"
          style="color: white !important;"
        >
          <v-subheader>Recent Rooms</v-subheader>

          <v-list class="pa-0">
            <v-list-item
              v-for="(item, index) in GET_RECENT_ROOMS.slice(0, 3)"
              :key="index"
              @click="recentConnect(item)"
            >
              <v-list-item-avatar
                width="32px"
              >
                <v-img
                  src="@/assets/images/logos/logo-small-light.png"
                />
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>{{ item.name || item.server || 'Custom' }}</v-list-item-title>

                <v-list-item-subtitle>
                  <b>{{ item.room }}</b>
                  <span style="opacity: 0.5; float: right;">{{ sinceNow(item.time) }}</span>
                </v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action>
                <v-tooltip
                  top
                  color="light-blue darken-4"
                >
                  <template #activator="{ on, attrs }">
                    <v-icon
                      color="white"
                      v-bind="attrs"
                      v-on="on"
                      @click.stop="REMOVE_RECENT_ROOM(item)"
                    >
                      close
                    </v-icon>
                  </template>
                  Remove
                </v-tooltip>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col
          v-if="!GET_SOCKET_ID"
          cols="12"
          class="nicelist pa-4"
          style="color: white !important;"
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
                style="border-radius: 20px;"
              >
                <v-row
                  justify="center"
                  align="center"
                  style="height: 100%;"
                >
                  <v-col
                    cols="12"
                    class="text-center pa-2"
                    style="height: 80px;"
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

                  <template v-if="GET_SERVERS_HEALTH && server.url !== 'custom'">
                    <template v-if="GET_SERVER_HEALTH(server.url)">
                      <v-col
                        cols="12"
                        class="text-center"
                      >
                        Ping:
                        <span
                          class="font-weight-bold"
                          :class="connectionQualityClass(GET_SERVER_HEALTH(server.url).latency)"
                        >{{ GET_SERVER_HEALTH(server.url).latency }}ms</span>
                      </v-col>

                      <v-col
                        cols="12"
                        class="text-center"
                      >
                        <div>
                          Load:
                          <span
                            class="font-weight-bold"
                            :class="loadQualityClass(GET_SERVER_HEALTH(server.url).load)"
                          >{{ GET_SERVER_HEALTH(server.url).load }}</span>
                        </div>
                      </v-col>
                    </template>

                    <div
                      v-else
                      class="text-center red--text"
                    >
                      error
                    </div>
                  </template>

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

            <v-col

              class="pa-2"
              cols="12"
              md="3"
              lg="2"
            >
              <v-card
                height="300px"
                style="border-radius: 20px;"
              >
                <v-row
                  justify="center"
                  align="center"
                  style="height: 100%;"
                >
                  <v-col
                    cols="12"
                    class="text-center pa-2"
                    style="height: 80px;"
                  >
                    <img
                      src="@/assets/images/synclounge-white.png"
                      class="server-image"
                    >
                  </v-col>

                  <v-col
                    cols="12"
                    class="text-center"
                  >
                    <h2>Custom Server</h2>
                    <h4>Anywhere!</h4>
                  </v-col>

                  <v-col
                    cols="12"
                    class="text-center pt-1 mt-4"
                  >
                    <v-btn
                      color="primary"
                      :disabled="connectionPending"
                      class="connect-button"
                      @click="serverSelected({custom: true})"
                    >
                      Connect
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <template v-if="selectedServer && selectedServer.custom">
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
                  color="primary"
                  class="pa-0 ma-0"
                  primary
                  style="width: 100%;"
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

        <v-col
          v-if="GET_SOCKET_ID"
          cols="12"
          class="text-center"
        >
          <v-row>
            <v-col
              cols="12"
              md="6"
              class="offset-md-3"
            >
              <v-text-field
                :value="GET_ROOM"
                origin="center center"
                :maxlength="25"
                name="input-2"
                label="Room name"
                :autofocus="true"
                @input="SET_ROOM"
                @keyup.enter.native="joinRoom"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="offset-md-3"
            >
              <v-text-field
                :value="GET_PASSWORD"
                transition="v-scale-transition"
                origin="center center"
                name="input-2"
                label="Room password"
                @input="SET_PASSWORD"
                @keyup.enter.native="joinRoom"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
              class="offset-md-3"
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
import { formatDistanceToNow } from 'date-fns';
import { mapGetters, mapMutations, mapActions } from 'vuex';
import linkWithRoom from '@/mixins/linkwithroom';

export default {
  name: 'AdvancedRoomJoin',

  mixins: [
    linkWithRoom,
  ],

  data: () => ({
    selectedServer: null,
    serverError: null,
    roomError: null,
    e1: 2,
    connectionPending: false,
    testConnectionInterval: null,
  }),

  computed: {
    ...mapGetters('synclounge', [
      'GET_SOCKET_ID',
      'GET_SYNCLOUNGE_SERVERS',
      'GET_SERVER',
      'GET_RECENT_ROOMS',
      'GET_ROOM',
      'GET_PASSWORD',
      'IS_IN_ROOM',
      'GET_SERVER_HEALTH',
      'GET_SERVERS_HEALTH',
    ]),

    ...mapGetters('settings', [
      'GET_CUSTOM_SERVER_USER_INPUTTED_URL',
    ]),
  },

  watch: {
    selectedServer() {
      this.serverError = null;
    },

    IS_IN_ROOM: {
      handler(inRoom) {
        if (inRoom) {
          this.$router.push(this.linkWithRoom({ name: 'PlexHome' }));
        }
      },

      immediate: true,
    },
  },

  beforeDestroy() {
    clearInterval(this.testConnectionInterval);
  },

  async created() {
    await this.FETCH_SERVERS_HEALTH();

    // TODO: rewrite this with a generator
    this.testConnectionInterval = setInterval(() => this.FETCH_SERVERS_HEALTH(),
      5000);
  },

  methods: {
    ...mapMutations('settings', ['SET_CUSTOM_SERVER_USER_INPUTTED_URL']),

    ...mapMutations('synclounge', [
      'SET_ROOM',
      'SET_PASSWORD',
      'SET_SERVER',
    ]),

    ...mapActions('synclounge', [
      'JOIN_ROOM_AND_INIT',
      'ESTABLISH_SOCKET_CONNECTION',
      'REMOVE_RECENT_ROOM',
      'ADD_EVENT_HANDLERS',
      'FETCH_SERVERS_HEALTH',
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

      if (!this.selectedServer.custom) {
        await this.attemptConnect();
      }
    },

    async attemptConnect() {
      this.serverError = null;

      try {
        this.SET_SERVER(this.selectedServer.url);
        await this.ESTABLISH_SOCKET_CONNECTION();

        if (this.GET_ROOM) {
          await this.joinRoom();
        }
      } catch (e) {
        this.serverError = `Failed to connect to ${this.selectedServer.url}`;
        console.error(e);
      } finally {
        this.connectionPending = false;
      }
    },

    async attemptConnectCustom() {
      this.connectionPending = true;
      this.serverError = null;

      try {
        this.SET_SERVER(this.GET_CUSTOM_SERVER_USER_INPUTTED_URL);
        const result = await this.ESTABLISH_SOCKET_CONNECTION();

        if (result) {
          this.serverError = `Failed to connect to ${this.GET_CUSTOM_SERVER_USER_INPUTTED_URL}`;
        } else {
          this.serverError = null;
        }
      } catch (e) {
        this.serverError = `Failed to connect to ${this.GET_CUSTOM_SERVER_USER_INPUTTED_URL}`;
        console.error(e);
      } finally {
        this.connectionPending = false;
      }
    },

    async recentConnect(recent) {
      console.log('Attempting to connect to', recent);
      this.selectedServer = {
        url: recent.server,
      };

      this.SET_ROOM(recent.room);
      this.SET_PASSWORD(recent.password);
      await this.attemptConnect();
    },

    async joinRoom() {
      if (!this.GET_SOCKET_ID) {
        throw new Error('not connected to a server');
      }

      if (this.GET_ROOM === '' || this.GET_ROOM == null) {
        this.roomError = 'You must enter a room name!';
        throw new Error('no room specified');
      }

      try {
        await this.JOIN_ROOM_AND_INIT();
      } catch (e) {
        console.error(e);
        this.roomError = e;
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
