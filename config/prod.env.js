var git = require('git-rev-sync')

// console.log('Production env', process.env)

let settingsHelper = new (require('../SettingsHelper'))()

module.exports = {
  NODE_ENV: '"production"',
  gitHash: '"' + git.short() + '"',
  gitDate: '"' + git.date() + '"'
}
