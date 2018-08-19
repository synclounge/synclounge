var git = require('git-rev-sync')

let settings = new (require('../SettingsHelper'))()

console.log('Production settings', settings)

module.exports = {
  NODE_ENV: '"production"',
  gitHash: '"' + git.short() + '"',
  gitDate: '"' + git.date() + '"',

  webroot: '"' + settings.webroot + '"',
  autoJoin: '"' + settings.autoJoin + '"',
  autoJoinRoom: '"' + settings.autoJoinRoom + '"',
  autoJoinPassword: '"' + settings.autoJoinPassword + '"',
  autoJoinServer: '"' + settings.autoJoinServer + '"'
}
