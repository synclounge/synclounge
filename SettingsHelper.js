
const args = require('args-parser')(process.argv);
const settings = require('./settings.json');

module.exports = function () {
  const fields = [
    // Webapp settings
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
    },
    {
      local: 'customServer',
      env: 'CUSTOM_SERVER',
      default: ''
    },
    {
      local: 'servers',
      env: 'SERVERS',
      default: ''
    },
    // Server settings
    {
      local: 'serverroot',
      env: 'SERVER_ROOT',
      default: '/slserver'
    },
    {
      local: 'server_port',
      env: 'SERVER_PORT',
      default: '8089'
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
    output[setting.local] = args[setting.env] || args[setting.local] || process.env[setting.env] || process.env[setting.local] || settings[setting.env] || settings[setting.local] || setting.default;

    // Make sure these settings are properly formatted
    if(output[setting.local]) {
      // Make sure these settings are properly formatted to JSON
      let jsonSettings = ['authentication', 'customServer'];
      if(jsonSettings.includes(setting.local) && output[setting.local]) {
        if(typeof output[setting.local] !== "object") {
          console.log(`${setting.local}/${setting.env} must be a JSON object. Attempting to convert it for you.`);
          try {
            let parsed = JSON.parse(output[setting.local]);
            output[setting.local] = parsed;
          }
          catch(e) {
            console.log(`- Unable to parse '${output[setting.local]}'`);
            console.log(`- Please check your syntax. Reverting to default.`);
          }
          console.log(`- Done.`);
        }
      }
      // Make sure these settings are properly formatted to an Array
      // This currently is only coded to handle the servers setting which is an Array of JSON objects
      let arraySettings = ['servers'];
      if(arraySettings.includes(setting.local)) {
        if(!Array.isArray(output[setting.local])) {
          console.log(`${setting.local}/${setting.env} must be an Array of JSON objects. Attempting to convert it for you.`);

          let temp = output[setting.local].trim();

          temp = temp.replace("[", "");
          temp = temp.replace("]", "");
          let tempArr = temp.split("},");

          if(tempArr.length > 0) {
            let tempOutArr = [];
            tempArr.forEach(element => {
              try {
                if(!element.endsWith('}')) {
                  element = element + '}';
                }
                let parsed = JSON.parse(element);

                tempOutArr.push(parsed);
              }
              catch(e) {
                console.log(`- Unable to parse '${element}'`);
                console.log(`- Please check your syntax. Skipping...`);
              }
            });

            if(tempOutArr.length == 0) {
              console.log(`- No elements to use. Reverting to default.`);
            }
            output[setting.local] = tempOutArr;
          }
          else {
            console.log(`No array elements found =(. Reverting to default.`);
            output[setting.local] = setting.default;
          }
          console.log(`- Done.`);
        }
      }
    }
    // Backwards compatibilty for PORT ENV setting
    if(setting.local == 'webapp_port' && output[setting.local] == 8088) {
      let port = args['PORT'] || process.env['PORT'] || settings['PORT'];
      if(port && port !== 8088) {
        console.log(`Please change 'PORT' to 'WEB_PORT'. Setting WEB_PORT to '${port}'`)
        output[setting.local] = port;
      }
    }

    // Remove trailing slashes, if they exist
    if ((setting.local == 'webroot' || setting.local == 'accessUrl') && output[setting.local].endsWith("/")) {
      console.log(`${setting.local}/${setting.env} should not end in '/'. Removing trailing slash(es) for you.`);
      output[setting.local] = output[setting.local].replace(/\/+$/, "");
      console.log(`- Done.`);
    }
    // Add leading slash, if not provided
    if (setting.local == 'webroot' && output[setting.local].length > 1 && !output[setting.local].startsWith("/")) {
      console.log(`${setting.local}/${setting.env} should always start with '/'. Adding the leading slash for you.`);
      // Make sure it starts with one leading slash
      output[setting.local] = `/${output[setting.local]}`;
      console.log(`- Done.`);
    }
    // Make sure 'webroot' and 'serverroot' aren't set to '/'. Revert to default if they do.
    if ((setting.local == 'webroot' || setting.local == 'serverroot') && output[setting.local] == '/') {
      console.log(`${setting.local}/${setting.env} cannot be set to '/'. Reverting to default: '${setting.default}'`);
      output[setting.local] = setting.default;
      console.log(`- Done.`);
    }
    process.env[setting.env] = typeof output[setting.local] === 'object' ? JSON.stringify(output[setting.local]) : output[setting.local];
  }
  //console.log('Our settings are', output)
  return output;
};
