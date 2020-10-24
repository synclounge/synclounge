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
              :disabled="!clientConnectable"
              @click="joinInvite"
            >
              Join Invite
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
import linkWithRoom from '@/mixins/linkwithroom';

export default {
  name: 'RoomJoin',

  components: {
    PlexClientPicker: () => import('@/components/PlexClientPicker.vue'),
  },

  mixins: [
    redirection,
    linkWithRoom,
  ],

  props: {
    room: {
      type: String,
      required: true,
    },

    server: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    loading: false,
    error: null,

    // Default true because default client is slplayer
    clientConnectable: true,
  }),

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_MEDIA_METADATA',
      'GET_CHOSEN_CLIENT',
    ]),
  },

  async created() {
    await this.DISCONNECT_IF_CONNECTED();
  },

  methods: {
    ...mapActions('synclounge', [
      'SET_AND_CONNECT_AND_JOIN_ROOM',
      'DISCONNECT_IF_CONNECTED',
    ]),

    async joinInvite() {
      this.error = null;
      this.loading = true;

      try {
        await this.SET_AND_CONNECT_AND_JOIN_ROOM({
          server: this.server,
          room: this.room,
        });

        if (this.$route.name === 'RoomJoin') {
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
      }

      this.loading = false;
    },
  },
};
</script>
