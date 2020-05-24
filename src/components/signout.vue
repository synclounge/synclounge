<template>
  <v-layout wrap row>
    <v-flex xs12 md8 offset-md2>
      <h1 class="white--text center-text pa-4">Successfully signed out</h1>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'signout',
  mounted() {
    this.SET_PLEX_AUTH_TOKEN(null);
    this.$store.state.plex = null;
    this.$store.state.signedin = 'notsignedin';
    setTimeout(() => {
      location.reload();
    }, 2500);
  },
  methods: {
    ...mapMutations('settings', [
      'SET_PLEX_AUTH_TOKEN'
    ]),
  }
};
</script>
