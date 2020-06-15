<template>
  <v-container class="fill-height">
    <v-row
      align="center"
      justify="center"
    >
      <v-col>
        <v-card
          class="mx-auto"
          max-width="500"
        >
          <v-card-title>
            Welcome to SyncLounge
          </v-card-title>

          <v-card-actions>
            <v-btn
              color="primary"
              :disabled="!GET_SERVERS_HEALTH"
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
  name: 'CreateRoom',
  computed: {
    ...mapGetters([
      'GET_SERVERS_HEALTH',
      'getLogos',
    ]),
  },

  created() {
    this.FETCH_SERVERS_HEALTH();
  },

  methods: {
    ...mapActions([
      'FETCH_SERVERS_HEALTH',
      'CREATE_AND_JOIN_ROOM',
    ]),

    async createRoom() {
      await this.CREATE_AND_JOIN_ROOM();
      this.$router.push('/browse');
    },
  },
};
</script>
