export default {
  methods: {
    redirectToMediaPage() {
      this.$router.push({
        name: 'nowplaying',
        params: {
          machineIdentifier: this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA']
            .machineIdentifier,
          ratingKey: this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
        },
      });
    },
  },
};
