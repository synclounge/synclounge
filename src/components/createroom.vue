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
              :src="getLogos.light.long"
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

export default {
  components: {
    clientpicker: () => import('@/components/clientpicker.vue'),
  },

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
      'getLogos',
      'GET_CONFIG',
    ]),

    ...mapGetters('synclounge', [
      'GET_SERVERS_HEALTH',
    ]),
  },

  created() {
    this.fetchServersHealth();

    if (this.GET_CONFIG.autoJoin) {
      this.$router.push({
        name: 'join',
        params: {
          server: this.GET_CONFIG.autoJoinServer,
          room: this.GET_CONFIG.autoJoinRoom,
          password: this.GET_CONFIG.autoJoinPassword,
        },
      });
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
        this.$router.push({ name: 'browse' });
      } catch (e) {
        this.error = e.message;
      }

      this.loading = false;
    },
  },
};
</script>
