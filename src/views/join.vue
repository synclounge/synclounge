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
            v-if="!GET_CONFIG.force_slplayer"
            multiple
            flat
          >
            <v-expansion-panel>
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
          </v-expansion-panels>

          <v-card-actions>
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

export default {
  components: {
    clientpicker: () => import('@/components/plex/clientpicker.vue'),
  },

  mixins: [
    redirection,
  ],

  props: {
    server: {
      type: String,
      default: '',
    },

    room: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      loading: false,

      // Default true because default client is slplayer
      clientConnectable: true,

      error: null,
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
          password: this.password,
        });

        if (this.$route.name === 'join') {
          if (this.GET_CHOSEN_CLIENT_ID === slPlayerClientId || !this.GET_ACTIVE_MEDIA_METADATA) {
            this.$router.push({ name: 'browse' });
          } else {
            this.redirectToMediaPage();
          }
        }
      } catch (e) {
        console.log(e);
        this.error = e.message;
      }

      this.loading = false;
    },
  },
};
</script>
