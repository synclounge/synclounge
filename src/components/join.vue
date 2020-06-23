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

export default {
  components: {
    clientpicker: () => import('@/components/clientpicker.vue'),
  },

  props: {
    server: {
      type: String,
      required: true,
    },

    room: {
      type: String,
      required: true,
    },
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
  },

  methods: {
    ...mapActions('synclounge', [
      'autoJoin',
    ]),

    async joinInvite() {
      await this.autoJoin({
        server: this.server,
        room: this.room,
      });
      // TODO: probably show error if this fails

      this.$router.push('/browse');
    },
  },
};
</script>
