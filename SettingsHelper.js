
const args = require('args-parser')(process.argv);
const settings = require('./settings.json');

const defaults = {
  webroot: '',
  serverroot: '',
  accessUrl: '',
  autoJoin: false,
  autoJoinServer: '',
  autoJoinRoom: '',
  autoJoinPassword: '',
  servers: '',
  customServer: '',
};

module.exports = function () {
  const fields = [
    'webroot',
    'serverroot',
    'accessUrl',
    'autoJoin',
    'autoJoinServer',
    'autoJoinRoom',
    'autoJoinPassword',
    'servers',
    'customServer',
  ];
  // Load and export our settings in preference of ENV -> args
  const output = {};
  for (let i = 0; i < fields.length; i++) {
    const setting = fields[i];
    // console.log('Processing setting', setting)
    // console.log(args[setting], process.env[setting], defaults[setting])
    output[setting] = args[setting] || process.env[setting] || settings[setting] || defaults[setting];
    process.env[setting] = output[setting];
  }
  // console.log('Our settings are', output)
  return output;
};
