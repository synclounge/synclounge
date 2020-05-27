import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: 'md',
  },
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#E5A00D',
        secondary: '#b0bec5',
        accent: '#E5A00D',
        error: '#b71c1c',
      },
    },
  },
});
