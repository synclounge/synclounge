<template>
  <v-container>
    <v-card
      style="background: rgba(0,0,0,0.3)"
      class="pa-1"
    >
      <v-card-title>
        Welcome to SyncLounge
      </v-card-title>


      <v-card-actions>
        <v-btn
          :disabled="!GET_SERVERS_HEALTH"
          @click="createRoom"
        >
          Create Room
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>


<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'CreateRoom',
  computed: {
    ...mapGetters([
      'GET_SERVERS_HEALTH',
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
