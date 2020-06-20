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
      :id="getMsgId(msg)"
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

  methods: {
    getMsgId(msg) {
      if (this.getMessages && msg === this.getMessages[this.getMessages.length - 1]) {
        return 'lastMessage';
      }
      return '';
    },
  },
};
</script>
