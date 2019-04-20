const git = require('git-rev-sync');

const settings = new (require('../SettingsHelper'))();

console.log('Production settings', settings);

module.exports = {
  NODE_ENV: '"production"',
  gitHash: `"${git.short()}"`,
  gitDate: `"${git.date()}"`,

  webroot: `"${settings.webroot}"`,
  API_OVERRIDE: `"${process.env.API_OVERRIDE}"` || undefined,
};
