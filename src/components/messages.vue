<template>
  <v-list
    v-chat-scroll
    subheader
    dense
  >
    <v-subheader class="md-4">
      Chat
    </v-subheader>

    <message
      v-for="(msg, index) in GET_MESSAGES"
      :key="index"
      :message="msg"
    />
  </v-list>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  components: {
    message: () => import('./message.vue'),
  },

  computed: {
    ...mapGetters('synclounge', [
      'GET_MESSAGES',
    ]),
  },
};
</script>
