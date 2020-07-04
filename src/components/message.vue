<template>
  <v-list-item>
    <v-list-item-avatar size="32">
      <v-img
        :src="sender.thumb"
      />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text="sender.username" />

      <v-list-item-subtitle
        class="message-content"
        v-text="message.text"
      />
    </v-list-item-content>
  </v-list-item>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters('synclounge', [
      'GET_USER',
    ]),

    sender() {
      return this.GET_USER(this.message.senderId);
    },
  },
};
</script>

<style scoped>
.message-content {
   white-space: normal !important;
   font-weight: normal !important;
}
</style>
