
var jsonfile = require('jsonfile')
const args = require('args-parser')(process.argv)

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
  // Load and export our settings in preference of ENV -> settings.json -> example_settings.json
  let output = {}
  let settingsFile
  try {
    settingsFile = require('./settings.json')
  } catch (e) {
    console.log('Creating default settings.json')
    let defaults = require('./example_settings.json')
    jsonfile.writeFileSync('./settings.json', defaults)
    settingsFile = defaults
  }
  let defaults = require('./example_settings.json')
  for (let i = 0; i < fields.length; i++) {
    let setting = fields[i]
    output[setting] = args[setting] || process.env[setting] || settingsFile[setting] || defaults[setting]
  }
  return output
}
