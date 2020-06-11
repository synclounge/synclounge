<template>
  <v-text-field
    v-model="messageToBeSent"
    append-outer-icon="send"
    :label="chatboxLabel"
    hide-details
    single-line
    class="ml-2 mr-2 pr-1"
    @click:append-outer="sendMessage()"
    @keyup.enter.native="sendMessage()"
  />
</template>

<script>

import { mapActions } from 'vuex';

export default {
  data() {
    return {
      messageToBeSent: '',
    };
  },

  computed: {
    chatboxLabel() {
      return 'Message';
    },
  },

  methods: {
    ...mapActions(['sendNewMessage']),
    sendMessage() {
      if (this.messageToBeSent === '') {
        return;
      }
      console.log(`We should send this message: ${this.messageToBeSent}`);
      this.sendNewMessage(this.messageToBeSent);
      this.messageToBeSent = '';
    },
  },
};
</script>
