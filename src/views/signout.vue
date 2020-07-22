<template>
  <v-row>
    <v-col
      cols="12"
      md="8"
      class="offset-md-2"
    >
      <h1 class="white--text center-text pa-4">
        Successfully signed out
      </h1>
    </v-col>
  </v-row>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'Signout',

  created() {
    this.SET_PLEX_AUTH_TOKEN(null);
    setTimeout(() => {
      window.location.reload();
    }, 2500);
  },

  methods: {
    ...mapMutations('plex', [
      'SET_PLEX_AUTH_TOKEN',
    ]),
  },
};
</script>
