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
              @click="joinInvite"
            >
              Join Invite
            </v-btn>

            <v-spacer />

            <v-btn>
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

  computed: {
    ...mapGetters([
      'getLogos',
    ]),
  },

  methods: {
    ...mapActions([
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
