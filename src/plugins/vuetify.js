import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: 'md',
  },

  theme: {
    dark: true,
    options: {
      customProperties: true,
    },

    themes: {
      dark: {
        primary: '#e5a00d',
      },
    },
  },
});
