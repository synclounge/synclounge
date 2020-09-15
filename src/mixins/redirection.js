import getContentLink from '@/utils/contentlinks';

export default {
  methods: {
    redirectToMediaPage() {
      this.$router.push(
        getContentLink(this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA']),
      );
    },
  },
};
