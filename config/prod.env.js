var git = require('git-rev-sync')

console.log('Production env', process.env)

module.exports = {
  NODE_ENV: '"production"',
  gitHash: '"' + git.short() + '"',
  gitDate: '"' + git.date() + '"'
}
