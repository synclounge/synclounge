var merge = require('webpack-merge')
var prodEnv = require('./prod.env')
var git = require('git-rev-sync')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  gitHash: '"' + git.short() + '"',
  gitDate: '"' + git.date() + '"'
})
