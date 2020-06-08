<template>
  <v-layout
    wrap
    row
    class="text-center"
    justify-center
    align-center
  >
    <v-flex
      v-if="!loading"
      xs12
      md5
    >
      <v-card
        style="background: rgba(0,0,0,0.3)"
        class="pa-1"
      >
        <v-container fill-height>
          <v-layout
            row
            wrap
          >
            <v-flex
              xs12
              md3
              class="text-center"
            >
              <img
                :src="getLogos.light.small"
                style="width: 90%"
              >
            </v-flex>
            <v-flex md9>
              <h1 class="white--text pa-1">
                Welcome to SyncLounge!
              </h1>
              <div class="pt-2">
                <div>
                  <span style="font-weight:900">{{ owner }}</span> has invited you to join the room
                  <span style="font-weight:900">{{ room }}</span>
                </div>
              </div>
              <v-layout
                wrap
                row
                class="pa-4 pt-2"
                justify-center
                align-center
              >
                <v-flex
                  xs12
                  md8
                  class="text-center"
                >
                  <v-btn
                    class="center"
                    style="background-color: #E5A00D"
                    @click.native="letsGo()"
                  >
                    Accept Invite
                  </v-btn>
                </v-flex>
              </v-layout>
            </v-flex>
          </v-layout>
        </v-container>
        <v-divider />
        <p
          style="opacity:0.7"
          class="text-center pt-3"
        >
          SyncLounge is a tool to sync Plex content with your family and friends.
          For more info click
          <a
            target="_blank"
            href="https://github.com/samcm/synclounge"
          > here</a>.
        </p>
      </v-card>
    </v-flex>
    <v-flex v-else>
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </v-flex>
  </v-layout>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Join',
  data() {
    return {
      server: null,
      password: null,
      room: null,
      owner: null,
    };
  },

  computed: {
    ...mapGetters([
      'getLogos',
    ]),

    ...mapGetters('settings', [
      'GET_PLEX_AUTH_TOKEN',
    ]),

    gotDevices() {
      return this.$store.state.plex.gotDevices;
    },
    loading() {
      if (!this.GET_PLEX_AUTH_TOKEN) {
        return false;
      }
      return !this.$store.state.plex.gotDevices;
    },
  },

  watch: {
    gotDevices(to) {
      if (to) {
        if (this.$route.query.autojoin) {
          this.letsGo();
        }
      }
    },
  },
  mounted() {
    this.password = this.$route.query.password || '';
    this.room = this.$route.query.room;
    this.server = this.$route.query.server;
    this.owner = this.$route.query.owner;
  },
  methods: {
    async letsGo() {
      this.$store.commit('SET_AUTOJOIN', true);
      this.$store.commit('SET_AUTOJOINROOM', this.room);
      this.$store.commit('SET_AUTOJOINPASSWORD', this.password);
      this.$store.commit('SET_VALUE', ['autoJoinOwner', this.owner]);
      this.$store.commit('SET_AUTOJOINURL', this.server);

      await this.$store.dispatch('autoJoin', {
        server: this.server,
        password: this.password,
        room: this.room,
      });
      this.$router.push('/browse');
    },
  },

};
</script>
