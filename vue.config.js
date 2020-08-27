const path = require('path');
const LCL = require('last-commit-log');

const lcl = new LCL();

const config = require('./config');

const configFile = 'public/config.json';
const appConfig = config.get(configFile);
console.log(appConfig);
config.save(appConfig, configFile);

const pkgVersion = require('./package.json').version;

process.env.VUE_APP_VERSION = process.env.VERSION || pkgVersion;

try {
  const lastCommit = lcl.getLastCommitSync();
  process.env.VUE_APP_GIT_HASH = lastCommit.shortHash;
  process.env.VUE_APP_GIT_DATE = lastCommit.committer.date;
} catch (e) {
  // Sometimes on CI stuff they build with .git being present
  // TODO: find better way to do this
  process.env.VUE_APP_GIT_DATE = Math.floor(Date.now() / 1000);
  process.env.VUE_APP_GIT_HASH = process.env.REVISION;
}

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
