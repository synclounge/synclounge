var git = require('git-rev-sync')

module.exports = {
  NODE_ENV: '"production"',
  gitHash: '"' + git.short() + '"',
  gitDate: '"' + git.date() + '"'
}
