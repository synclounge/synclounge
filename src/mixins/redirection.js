export default {
  methods: {
    redirectToMediaPage() {
      this.$router.push({
        name: 'NowPlaying',
        params: {
          machineIdentifier: this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA']
            .machineIdentifier,
          ratingKey: this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
        },
      });
    },
  },
};
