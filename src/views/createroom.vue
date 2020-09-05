<template>
  <v-container class="fill-height">
    <v-row
      align="center"
      justify="center"
    >
      <v-col>
        <v-card
          class="mx-auto"
          max-width="550"
          :loading="loading"
        >
          <v-card-title>
            <v-img
              contain
              src="@/assets/images/logos/logo-long-light.png"
            />
          </v-card-title>

          <v-alert
            v-if="error"
            type="error"
          >
            {{ error }}
          </v-alert>

          <v-alert
            v-if="GET_SERVERS_HEALTH && Object.keys(GET_SERVERS_HEALTH).length === 0"
            prominent
            type="error"
          >
            <v-row align="center">
              <v-col class="grow">
                No connectable SyncLounge servers
              </v-col>
              <v-col class="shrink">
                <v-btn
                  @click="fetchServersHealth"
                >
                  Refresh
                </v-btn>
              </v-col>
            </v-row>
          </v-alert>

          <v-expansion-panels
            multiple
          >
            <v-expansion-panel
              :readonly="GET_CONFIG.force_slplayer"
            >
              <v-expansion-panel-header>
                Player: {{ GET_CHOSEN_CLIENT.name }}
              </v-expansion-panel-header>

              <v-expansion-panel-content>
                <clientpicker
                  @loadingChange="loading = $event"
                  @clientConnectableChange="clientConnectable = $event"
                />
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-header>
                Room: {{ roomName }}
              </v-expansion-panel-header>

              <v-expansion-panel-content>
                <v-text-field
                  v-model="roomName"
                  label="Room Name"
                />
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-header disable-icon-rotate>
                Password
                <template v-slot:actions>
                  <v-icon>
                    lock
                  </v-icon>
                </template>
              </v-expansion-panel-header>

              <v-expansion-panel-content>
                <v-text-field
                  v-model="roomPassword"
                  label="Room Password"
                />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-card-actions class="mt-2">
            <v-btn
              color="primary"
              :disabled="!GET_SERVERS_HEALTH || Object.keys(GET_SERVERS_HEALTH).length === 0
                || !clientConnectable || loading"
              @click="createRoom"
            >
              Create Room
            </v-btn>

            <v-spacer />

            <v-btn to="/clientselect">
              Advanced
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import redirection from '@/mixins/redirection';
import { slPlayerClientId } from '@/player/constants';
import randomWords from 'random-words';
import JoinError from '@/utils/joinerror';

export default {
  components: {
    clientpicker: () => import('@/components/plex/clientpicker.vue'),
  },

  mixins: [
    redirection,
  ],

  data() {
    return {
      loading: false,
      error: null,

      // Default true because default client is slplayer
      clientConnectable: true,
      roomName: this.makeRandomRoomName(),
      roomPassword: null,
    };
  },

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_MEDIA_METADATA',
      'GET_CHOSEN_CLIENT',
    ]),

    ...mapGetters('synclounge', [
      'GET_SERVERS_HEALTH',
      'GET_BEST_SERVER',
    ]),
  },

  async created() {
    await this.DISCONNECT_IF_CONNECTED();

    if (this.GET_CONFIG.autojoin) {
      this.$router.push({
        name: 'join',
        params: this.GET_CONFIG.autojoin,
      });
    } else {
      await this.fetchServersHealth();
    }
  },

  methods: {
    ...mapActions('synclounge', [
      'FETCH_SERVERS_HEALTH',
      'SET_AND_CONNECT_AND_JOIN_ROOM',
      'DISCONNECT_IF_CONNECTED',
    ]),

    makeRandomRoomName() {
      return randomWords({ exactly: 3, join: ' ' });
    },

    async fetchServersHealth() {
      try {
        await this.FETCH_SERVERS_HEALTH();
      } catch (e) {
        console.error(e);
        this.error = 'Unable to fetch servers health';
      }
    },

    async createRoom() {
      this.error = null;
      this.loading = true;

      try {
        await this.SET_AND_CONNECT_AND_JOIN_ROOM({
          server: this.GET_BEST_SERVER,
          room: this.roomName,
          password: this.roomPassword,
        });

        if (this.$route.name === 'CreateRoom') {
          if (this.GET_CHOSEN_CLIENT_ID === slPlayerClientId || !this.GET_ACTIVE_MEDIA_METADATA) {
            this.$router.push({ name: 'browse' });
          } else {
            this.redirectToMediaPage();
          }
        }
      } catch (e) {
        this.DISCONNECT_IF_CONNECTED();
        console.error(e);

        if (e instanceof JoinError) {
          this.error = 'Room already in use';
          this.roomName = this.makeRandomRoomName();
        } else {
          this.error = e.message;
        }
      }

      this.loading = false;
    },
  },
};
</script>
