import contentLink from '@/mixins/helpers/contentlink';

export default {
  methods: {
    contentLink(params) {
      return contentLink(this.$store.getters, params);
    },
  },
};
