import linkWithRoom from '@/mixins/helpers/linkwithroom';

export default {
  methods: {
    linkWithRoom(params) {
      return linkWithRoom(this.$store.getters, params);
    },
  },
};
