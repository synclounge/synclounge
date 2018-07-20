
const args = require('args-parser')(process.argv)
const defaults = {
  'webroot': '',
  'serverroot': '',
  'accessUrl': '',
  'autoJoin': false,
  'autoJoinServer': '',
  'autoJoinRoom': '',
  'autoJoinPassword': ''
}
module.exports = function () {
  const fields = [
    'webroot',
    'serverroot',
    'accessUrl',
    'autoJoin',
    'autoJoinServer',
    'autoJoinRoom',
    'autoJoinPassword'
  ]
  // Load and export our settings in preference of ENV -> args
  let output = {}
  for (let i = 0; i < fields.length; i++) {
    let setting = fields[i]
    output[setting] = args[setting] || process.env[setting] || defaults[setting]
    process.env[setting] = output[setting]
  }
  console.log('Our settings are', output)
  return output
}
