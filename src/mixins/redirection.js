export default {
  methods: {
    redirectToMediaPage() {
      if (this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA']) {
        this.$router.push({
          name: 'nowplaying',
          params: {
            machineIdentifier: this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA'].machineIdentifier,
            ratingKey: this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
          },
        });
      } else if (this.$route.fullPath.indexOf('/nowplaying') > -1) {
        this.$router.push({ name: 'browse' });
      }
    },
  },
};
