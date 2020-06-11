<template>
  <div>
    <v-divider class="hidden-md-and-down" />
    <v-list
      v-chat-scroll
      subheader
      dense
    >
      <v-subheader class="md-4">
        Chat
      </v-subheader>

      <message
        v-for="(msg, index) in getMessages"
        :id="getMsgId(msg)"
        :key="index"
        :message="msg"
      />
    </v-list>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  components: {
    message: () => import('./message.vue'),
  },

  computed: {
    ...mapGetters(['getMessages']),
  },

  watch: {
    messages() {
      const options = {
        container: '#chatbox',
        easing: 'linear',
        duration: 1,
        cancelable: false,
      };
      this.$scrollTo('#lastMessage', 5, options);
    },
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
