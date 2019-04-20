const git = require('git-rev-sync');

const settings = new (require('../SettingsHelper'))();

console.log('Production settings', settings);
if (process.env.API_OVERRIDE) {
  console.log('Building with API_OVERRIDE', process.env.API_OVERRIDE);
}

module.exports = {
  NODE_ENV: '"production"',
  gitHash: `"${git.short()}"`,
  gitDate: `"${git.date()}"`,

  webroot: `"${settings.webroot}"`,
  API_OVERRIDE: `"${process.env.API_OVERRIDE}"` || undefined,
};
