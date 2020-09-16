import contentLink from '@/mixins/helpers/contentlink';

export default {
  methods: {
    redirectToMediaPage() {
      this.$router.push(
        contentLink(
          this.$store.getters,
          this.$store.getters['plexclients/GET_ACTIVE_MEDIA_METADATA'],
        ),
      );
    },
  },
};
