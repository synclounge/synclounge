const path = require('path');

const config = require('./config');

const configFile = 'public/config.json';
const appConfig = config.get(configFile);
console.log(appConfig);
config.save(appConfig, configFile);

const pkgVersion = require('./package.json').version;

process.env.VUE_APP_VERSION = process.env.VERSION || pkgVersion;

module.exports = {
  // Relative publicPath to support subfolders
  publicPath: '',
  transpileDependencies: ['vuetify'],
  integrity: true,
  configureWebpack: {
    resolve: {
      alias: {
        // Alias @ to /src folder for ES/TS imports
        '@': path.join(__dirname, '/src'),
      },
    },
    node: false,
  },

  pluginOptions: {
    lintStyleOnBuild: true,
    stylelint: {},
  },

  // devServer: {
  //   disableHostCheck: true,
  // },

  // https://github.com/vuejs/vue-cli/issues/3771
  css: {
    extract: process.env.NODE_ENV === 'production' ? {
      ignoreOrder: true,
    } : false,
  },

  chainWebpack: (conf) => {
    conf
      .plugin('html')
      .tap((args) => {
        // eslint-disable-next-line no-param-reassign
        args[0].title = 'SyncLounge';
        return args;
      });
  },
};
