export default {
  methods: {
    getAppWidth() {
      return Math.round(Math.max(document.documentElement.clientWidth,
        window.innerWidth || 0));
    },

    getAppHeight() {
      return Math.round(Math.max(document.documentElement.clientHeight,
        window.innerHeight || 0));
    },
  },
};
