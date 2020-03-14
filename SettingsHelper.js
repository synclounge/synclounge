
const args = require('args-parser')(process.argv);
const settings = require('./settings.json');

module.exports = function () {
  const fields = [
    {
      local: 'webroot',
      env: 'WEB_ROOT',
      default: ''
    },
    {
      local: 'webapp_port',
      env: 'WEB_PORT',
      default: '8088'
    },
    {
      local: 'accessUrl',
      env: 'WEB_ACCESSURL',
      default: ''
    },
    {
      local: 'serverroot',
      env: 'SERVER_ROOT',
      default: ''
    },
    {
      local: 'server_port',
      env: 'SERVER_PORT',
      default: '8089'
    },
    {
      local: 'autoJoin',
      env: 'AUTOJOIN_ENABLED',
      default: 'false'
    },
    {
      local: 'autoJoinServer',
      env: 'AUTOJOIN_SERVERURL',
      default: ''
    },
    {
      local: 'autoJoinRoom',
      env: 'AUTOJOIN_ROOM',
      default: ''
    },
    {
      local: 'autoJoinPassword',
      env: 'AUTOJOIN_PASSWORD',
      default: ''
    },
    {
      local: 'authentication',
      env: 'AUTHENTICATION',
      default: {
        mechanism: 'none'
      }
    }
  ];
  // Load and export our settings in preference of ENV -> args
  const output = {};
  for (let i = 0; i < fields.length; i++) {
    const setting = fields[i];
    // console.log('Processing setting', setting);
    // console.log(`Args: '${args[setting.env]}'; '${args[setting.local]}'`);
    // console.log(`ENV: '${process.env[setting.env]}'; '${process.env[setting.local]}'`);
    // console.log(`Settings: '${settings[setting.local]}'; '${setting.default}'`);
    output[setting.local] = args[setting.env] || args[setting.local] || process.env[setting.env] || process.env[setting.local] || settings[setting.local] || setting.default;

    // Remove trailing slashes, if they exist
    if ((setting.local == 'webroot' || setting.local == 'accessUrl') && output[setting.local].endsWith("/")) {
      output[setting.local] = output[setting.local].replace(/\/+$/, "");
    }
    // Add leading slash, if not provided
    if (setting.local == 'webroot' && !output[setting.local].startsWith("/")) {
      // Make sure it starts with one leading slash
      output[setting.local] = `/${output[setting.local]}`;
    }
    process.env[setting.local] = output[setting.local];
  }
  //console.log('Our settings are', output)
  return output;
};
