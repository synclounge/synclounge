const argv = require('minimist')(process.argv.slice(2));

const { coalesce } = require('./src/utils/helpers');

const readSettingsFile = (file) => {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(file);
  } catch (e) {
    return {};
  }
};

const settings = readSettingsFile('./settings.json');

const fields = [
  // Webapp settings
  {
    local: 'webroot',
    env: 'WEB_ROOT',
    default: '',
    type: 'string',
  },
  {
    local: 'webapp_port',
    env: 'WEB_PORT',
    default: '8088',
    type: 'number',
  },
  {
    local: 'autoJoin',
    env: 'AUTOJOIN_ENABLED',
    default: false,
    type: 'boolean',
  },
  {
    local: 'autoJoinServer',
    env: 'AUTOJOIN_SERVERURL',
    default: '',
    type: 'string',
  },
  {
    local: 'autoJoinRoom',
    env: 'AUTOJOIN_ROOM',
    default: '',
    type: 'string',
  },
  {
    local: 'autoJoinPassword',
    env: 'AUTOJOIN_PASSWORD',
    default: '',
    type: 'string',
  },
  {
    local: 'authentication',
    env: 'AUTHENTICATION',
    default: {
      mechanism: 'none',
    },
    type: 'object',
  },
  {
    local: 'customServer',
    env: 'CUSTOM_SERVER',
    default: null,
    type: 'object',
  },
  {
    local: 'servers',
    env: 'SERVERS',
    default: [],
    type: 'array',
  },
  {
    local: 'autoplay',
    env: 'AUTOPLAY',
    default: true,
    type: 'boolean',
  },
  {
    local: 'slPlayerQuality',
    env: 'SLPLAYERQUALITY',
    default: null,
    type: 'number',
    // null is allowed because null quality indicates Original
    nullable: true,
  },
  {
    local: 'slPlayerForceTranscode',
    env: 'SLPLAYERFORCETRANSCODE',
    default: false,
    type: 'boolean',
  },
  {
    local: 'fetchConfig',
    env: 'FETCH_CONFIG',
    default: false,
    type: 'boolean',
  },
];

// Returns the parsed setting or default value if wrong type or unable to be parsed
const parseSetting = (value, setting) => {
  if (setting.type === 'array') {
    // If setting is array. (Have to treat arrays differently since typeof array is 'object')
    if (Array.isArray(value)) {
      return value;
    } if (typeof value === 'string') {
      // If setting is string, we have a chance to parse it and it might become an array
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // Success, we parsed and got an array
          return parsed;
        }
      } catch (e) {
        console.error(e.message);
      }
    }
  } else {
    // If setting is not array
    // eslint-disable-next-line valid-typeof
    if (typeof value === setting.type) {
      return value;
    } if (typeof value === 'string') {
      // If setting is string, we have a chance to parse it and it might become an array
      try {
        const parsed = JSON.parse(value);
        // eslint-disable-next-line valid-typeof
        if (typeof parsed === setting.type) {
          return parsed;
        }
      } catch (e) {
        console.error(e.message);
      }
    }
  }

  if (value !== undefined) {
    console.error(
      `Error parsing [${setting.local}]: Reverting to default. Value: '${value}'`,
    );
  }

  return setting.default;
};

module.exports = {
  readSettings() {
    // Load and export our settings in preference of Args -> ENV -> Settings file -> Default
    const output = {};
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < fields.length; i++) {
      const setting = fields[i];
      // console.log('Processing setting', setting);
      // console.log(`Args: '${argv[setting.env]}'; '${argv[setting.local]}'`);
      // console.log(`ENV: '${process.env[setting.env]}'; '${process.env[setting.local]}'`);
      // console.log(`Settings: '${settings[setting.local]}'; '${setting.default}'`);
      const value = coalesce(
        argv[setting.env],
        argv[setting.local],
        process.env[setting.env],
        process.env[setting.local],
        settings[setting.env],
        settings[setting.local],
        setting.default,
      );
      output[setting.local] = parseSetting(value, setting);

      // Backwards compatibilty for PORT ENV setting
      if (setting.local === 'webapp_port' && output[setting.local] === 8088) {
        const port = argv.PORT || process.env.PORT || settings.PORT;
        if (port && port !== 8088) {
          console.log(`Please change 'PORT' to 'WEB_PORT'. Setting WEB_PORT to '${port}'`);
          output[setting.local] = port;
        }
      }

      // Remove trailing slashes, if they exist
      if (
        (setting.local === 'webroot')
        && output[setting.local].endsWith('/')
      ) {
        console.log(
          `${setting.local}/${setting.env} should not end in '/'. Removing trailing slash(es) for you.`,
        );
        output[setting.local] = output[setting.local].replace(/\/+$/, '');
        console.log('- Done.');
      }
      // Add leading slash, if not provided
      if (
        setting.local === 'webroot'
        && output[setting.local].length > 1
        && !output[setting.local].startsWith('/')
      ) {
        console.log(
          `${setting.local}/${setting.env} should always start with '/'. Adding the leading slash for you.`,
        );
        // Make sure it starts with one leading slash
        output[setting.local] = `/${output[setting.local]}`;
        console.log('- Done.');
      }
      // Make sure 'webroot' and 'serverroot' aren't set to '/'. Revert to default if they do.
      if (
        (setting.local === 'webroot' || setting.local === 'serverroot')
        && output[setting.local] === '/'
      ) {
        console.log(
          `${setting.local}/${setting.env} cannot be set to '/'. Reverting to default: '${setting.default}'`,
        );
        output[setting.local] = setting.default;
        console.log('- Done.');
      }
      process.env[setting.env] = typeof output[setting.local] === 'object'
        ? JSON.stringify(output[setting.local])
        : output[setting.local];
    }

    // console.log('Our settings are', output)
    return output;
  },
};
