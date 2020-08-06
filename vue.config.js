const path = require('path');
const LCL = require('last-commit-log');

const lcl = new LCL();

const saveConfig = require('./config');

const config = saveConfig('public/config.json');
console.log(config);

process.env.VUE_APP_VERSION = require('./package.json').version;

try {
  const lastCommit = lcl.getLastCommitSync();
  process.env.VUE_APP_GIT_HASH = lastCommit.shortHash;
  process.env.VUE_APP_GIT_DATE = lastCommit.committer.date;
  process.env.VUE_APP_GIT_BRANCH = lastCommit.gitBranch;
} catch (e) {
  // Sometimes on CI stuff they build with .git being present
  // TODO: find better way to do this
  process.env.VUE_APP_GIT_DATE = Math.floor(Date.now() / 1000);
  process.env.VUE_APP_GIT_HASH = process.env.REVISION;
  process.env.VUE_APP_GIT_BRANCH = process.env.SOURCE_BRANCH;
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
};
