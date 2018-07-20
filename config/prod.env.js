var git = require('git-rev-sync')

// console.log('Production env', process.env)

let settings = new (require('../SettingsHelper'))()

module.exports = {
  NODE_ENV: '"production"',
  gitHash: '"' + git.short() + '"',
  gitDate: '"' + git.date() + '"',

  autoJoin: '"' + settings.autoJoin + '"',
  autoJoinRoom: '"' + settings.autoJoinRoom + '"',
  autoJoinPassword: '"' + settings.autoJoinPassword + '"',
  autoJoinServer: '"' + settings.autoJoinServer + '"'
}
