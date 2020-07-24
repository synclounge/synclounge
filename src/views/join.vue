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
    ...mapGetters('plexclients', [
      'GET_CHOSEN_CLIENT_ID',
      'GET_ACTIVE_MEDIA_METADATA',
    ]),
  },

  methods: {
    ...mapActions('synclounge', [
      'SET_AND_CONNECT_AND_JOIN_ROOM',
    ]),

    async joinInvite() {
      this.error = null;

      try {
        await this.SET_AND_CONNECT_AND_JOIN_ROOM({
          server: this.server,
          room: this.room,
          password: this.password,
        });

        if (this.$route.name === 'join') {
          if (this.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10' || !this.GET_ACTIVE_MEDIA_METADATA) {
            this.$router.push({ name: 'browse' });
          } else {
            this.redirectToMediaPage();
          }
        }
      } catch (e) {
        console.log(e);
        throw e;
        // this.error = e.message;
      }
    },
  },
};
</script>
