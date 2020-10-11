export default {
  methods: {
    async playMedia(metadata, mediaIndex, offset) {
      try {
        await this.$store.dispatch('plexclients/PLAY_MEDIA', {
          metadata,
          mediaIndex,
          machineIdentifier: metadata.machineIdentifier,
          offset,
          userInitiated: true,
        });
      } catch (e) {
        if (e.code === 7000) {
          console.debug('Player initialization aborted');
        } else {
          throw e;
        }
      }
    },
  },
};
