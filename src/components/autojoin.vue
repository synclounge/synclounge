<template>
  <v-row
    class="pt-2 pa-4"
    justify="center"
  >
    <v-col md="6">
      <v-card
        :loading="loading"
        class="pa-4"
      >
        <v-card-title>
          <v-img
            contain
            :src="getLogos.light.long"
          />
        </v-card-title>

        <v-alert
          v-if="error"
          type="error"
        >
          Unable to autojoin
        </v-alert>

        <v-card-actions>
          <v-btn
            class="primary"
            x-large
            text
            :disabled="loading"
            @click="join"
          >
            Join
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      error: false,
      loading: false,
    };
  },

  computed: {
    ...mapGetters([
      'getLogos',
    ]),
  },

  methods: {
    ...mapActions('synclounge', [
      'JOIN_CONFIG_SYNCLOUNGE_SERVER',
    ]),

    async join() {
      this.error = false;
      this.loading = true;
      try {
        await this.JOIN_CONFIG_SYNCLOUNGE_SERVER();
      } catch (e) {
        console.error(e);
        this.error = true;
      }

      this.loading = false;

      if (!this.error) {
        this.$router.push({ name: 'browse' });
      }
    },
  },
};
</script>
