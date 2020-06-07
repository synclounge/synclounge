const git = require('git-rev-sync');

const { readSettings } = require('../SettingsHelper');

const settings = readSettings();

console.log('Production settings', settings);
if (process.env.API_OVERRIDE) {
  console.log('Building with API_OVERRIDE', process.env.API_OVERRIDE);
}

module.exports = {
  NODE_ENV: '"production"',
  gitHash: `"${git.short()}"`,
  gitDate: `"${git.date()}"`,
  npm_package_version: `"${process.env.npm_package_version}"`,

  webroot: `"${settings.webroot}"`,
  API_OVERRIDE: `"${process.env.API_OVERRIDE}"` || undefined,
};
