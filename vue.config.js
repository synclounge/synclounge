let SettingsHelper = require('../SettingsHelper')
let settings = new SettingsHelper()

let baseUrl = undefined;
if (settings.webroot) {
  baseUrl = settings.webroot
}

module.exports = {
  baseUrl,
  outputDir: undefined,
  assetsDir: undefined,
  runtimeCompiler: true,
  productionSourceMap: undefined,
  parallel: undefined,
  css: undefined,
  lintOnSave: undefined
}