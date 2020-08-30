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
import { mapActions } from 'vuex';

export default {
  name: 'Signout',

  async created() {
    await this.RESET();

    setTimeout(() => {
      window.location.reload();
    }, 2500);
  },

  methods: {
    ...mapActions([
      'RESET',
    ]),
  },
};
</script>
