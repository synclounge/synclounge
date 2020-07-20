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

          <clientpicker
            @loadingChange="loading = $event"
            @clientConnectableChange="clientConnectable = $event"
          />

          <v-card-actions>
            <v-btn
              color="primary"
              :disabled="!GET_SERVERS_HEALTH || !clientConnectable || loading"
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
    };
  },

  computed: {
    ...mapGetters([
      'GET_CONFIG',
    ]),

    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
    ]),

    ...mapGetters('synclounge', [
      'GET_SERVERS_HEALTH',
    ]),
  },

  async created() {
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
      'CREATE_AND_JOIN_ROOM',
    ]),

    async fetchServersHealth() {
      try {
        await this.FETCH_SERVERS_HEALTH();
      } catch (e) {
        this.error = 'Unable to fetch servers health';
      }
    },

    async createRoom() {
      this.error = null;
      this.loading = true;

      try {
        await this.CREATE_AND_JOIN_ROOM();

        console.log(this.$route.name);
        if (this.$route.name === 'CreateRoom') {
          if (this.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10') {
            this.$router.push({ name: 'browse' });
          } else {
            this.redirectToMediaPage();
          }
        }
      } catch (e) {
        this.error = e.message;
      }

      this.loading = false;
    },
  },
};
</script>
