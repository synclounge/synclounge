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

          <clientpicker
            @loadingChange="loading = $event"
            @clientConnectableChange="clientConnectable = $event"
          />

          <v-card-actions>
            <v-btn
              color="primary"
              :disabled="!GET_SERVERS_HEALTH || !clientConnectable"
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

      // Default true because default client is slplayer
      clientConnectable: true,
    };
  },

  computed: {
    ...mapGetters([
      'getLogos',
    ]),

    ...mapGetters('synclounge', [
      'GET_SERVERS_HEALTH',
    ]),
  },

  created() {
    this.FETCH_SERVERS_HEALTH();
  },

  methods: {
    ...mapActions('synclounge', [
      'FETCH_SERVERS_HEALTH',
      'CREATE_AND_JOIN_ROOM',
    ]),

    async createRoom() {
      await this.CREATE_AND_JOIN_ROOM();
      this.$router.push({ name: 'browse' });
    },
  },
};
</script>
