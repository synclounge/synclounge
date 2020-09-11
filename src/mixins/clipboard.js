export default {
  methods: {
    async copyToClipboard(text) {
      await navigator.clipboard.writeText(text);

      await this.$store.dispatch('DISPLAY_NOTIFICATION', {
        text: 'Copied to clipboard',
        color: 'success',
      });
    },
  },
};
