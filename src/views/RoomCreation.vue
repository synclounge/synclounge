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
                <PlexClientPicker
                  @loading-change="loading = $event"
                  @client-connectable-change="clientConnectable = $event"
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
              Connect
            </v-btn>

            <v-spacer />

            <v-btn :to="{ name: 'AdvancedRoomWalkthrough' }">
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
import { getRandomRoomId } from '@/utils/random';
import linkWithRoom from '@/mixins/linkwithroom';

export default {
  name: 'RoomCreation',

  components: {
    PlexClientPicker: () => import('@/components/PlexClientPicker.vue'),
  },

  mixins: [
    redirection,
    linkWithRoom,
  ],

  data() {
    return {
      loading: false,
      error: null,

      // Default true because default client is slplayer
      clientConnectable: true,
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
    await this.fetchServersHealth();
  },

  methods: {
    ...mapActions('synclounge', [
      'FETCH_SERVERS_HEALTH',
      'SET_AND_CONNECT_AND_JOIN_ROOM',
      'DISCONNECT_IF_CONNECTED',
    ]),

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
          room: getRandomRoomId(),
        });

        if (this.$route.name === 'RoomCreation') {
          if (this.GET_CHOSEN_CLIENT_ID === slPlayerClientId || !this.GET_ACTIVE_MEDIA_METADATA) {
            this.$router.push(this.linkWithRoom({ name: 'PlexHome' }));
          } else {
            this.redirectToMediaPage();
          }
        }
      } catch (e) {
        this.DISCONNECT_IF_CONNECTED();
        console.error(e);

        this.error = e.message;
        await this.fetchServersHealth();
      }

      this.loading = false;
    },
  },
};
</script>
