<template>
  <v-list-item>
    <v-list-item-avatar size="32">
      <v-img
        :src="message.user.thumb || message.user.avatarUrl"
      />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text="message.user.username" />

      <v-list-item-subtitle
        class="message-content"
        v-text="message.msg"
      />
    </v-list-item-content>
  </v-list-item>
</template>

<script>
export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.messageAvatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.messageBubble {
  background: rgb(44, 44, 49);
  border-radius: 7px;
  width: fit-content;
  clear: both;
  font-size: 90%;
  max-width: 100%;
  word-wrap: break-word;
  opacity: 0.8;
  color: white;
}

.messageBubble.me {
  background: #e5a00d;
  float: right;
  color: rgb(44, 44, 49);
}

.message-content {
   white-space: normal !important;
   font-weight: normal !important;
}
</style>
