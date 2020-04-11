<template>
  <v-layout row wrap style="height: 100%;">
    <v-flex xs12 style="height: calc(100% - 96px)">
      <v-divider class="hidden-md-and-down"></v-divider>
      <v-subheader class="md-4">Chat</v-subheader>
      <v-layout row wrap id="chatbox" v-if="messages.length > 0" style="max-height: calc(100% - 32px); overflow-y: scroll">
        <message :message="msg" :id="getMsgId(msg)" v-for="(msg, index) in messages" :key="index"></message>
      </v-layout>
    </v-flex>
    <v-flex xs12>
      <v-text-field
        append-outer-icon="send"
        @click:append-outer="sendMessage()"
        :label="chatboxLabel"
        hide-details
        single-line
        class="ml-2 mr-2 pr-1"
        v-on:keyup.enter.native="sendMessage()"
        v-model="messageToBeSent"
      ></v-text-field>
      <!-- <v-btn block color="primary" @click="sendMessage()" :disabled="messageToBeSent.length === 0">Send<v-icon right>send</v-icon></v-btn> -->
    </v-flex>
  </v-layout>
</template>

<script>
import message from '@/components/message';
import fscreen from 'fscreen';

import { mapActions, mapGetters } from 'vuex';

export default {
  components: {
    message,
  },
  data() {
    return {
      messageToBeSent: '',
    };
  },
  watch: {
    messages() {
      const options = {
        container: '#chatbox',
        easing: 'linear',
        duration: 1,
        cancelable: false,
      };
      console.info(this.$vuetify.breakpoint);
      this.$scrollTo('#lastMessage', 5, options);
    },
  },
  computed: {
    messages() {
      return this.$store.getters.getMessages;
    },
    chatboxLabel() {
      return 'Message';
    },
  },
  methods: {
    getMsgId(msg) {
      if (this.messages && msg === this.messages[this.messages.length - 1]) {
        return 'lastMessage';
      }
    },
    sendMessage() {
      if (this.messageToBeSent === '') {
        return;
      }
      console.log(`We should send this message: ${this.messageToBeSent}`);
      this.$store.dispatch('sendNewMessage', this.messageToBeSent);
      this.messageToBeSent = '';
    },
  },
};
</script>
