
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
      default: '/slserver'
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
      local: 'custom_server',
      env: 'CUSTOM_SERVER',
      default: ''
    },
    {
      local: 'servers',
      env: 'SERVERS',
      default: ''
    }
  ];
  // Load and export our settings in preference of Args -> ENV -> Settings file -> Default
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
      console.log(`${setting.local}/${setting.env} should not end in '/'. Removing trailing slash(es) for you.`);
      output[setting.local] = output[setting.local].replace(/\/+$/, "");
    }
    // Add leading slash, if not provided
    if (setting.local == 'webroot' && !output[setting.local].startsWith("/")) {
      console.log(`${setting.local}/${setting.env} should always start with '/'. Adding the leading slash for you.`);
      // Make sure it starts with one leading slash
      output[setting.local] = `/${output[setting.local]}`;
    }
    // Make sure 'webroot' and 'serverroot' aren't set to '/'. Revert to default if they do.
    if ((setting.local == 'webroot' || setting.local == 'serverroot') && output[setting.local] == '/') {
      console.log(`${setting.local}/${setting.env} cannot be set to '/'. Reverting to default: '${setting.default}'`);
      output[setting.local] = setting.default;
    }
    process.env[setting.local] = output[setting.local];
  }
  //console.log('Our settings are', output)
  return output;
};
