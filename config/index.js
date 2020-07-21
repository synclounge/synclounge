const nconf = require('nconf');
const fs = require('fs');

const defaults = require('./defaults');

// Parses, saves, and returns the config
const saveConfig = (file) => {
  nconf
    .argv({
      separator: '__',
      parseValues: true,
    })
    .env({
      separator: '__',
      lowerCase: true,
      parseValues: true,
      whitelist: Object.keys(defaults).concat([
        'autojoin__server',
        'autojoin__room',
        'autojoin__password',
        'authentication__mechanism',
        'authentication__type',
        'authentication__authorized',

        'custom_server__name',
        'custom_server__location',
        'custom_server__url',
        'custom_server__image',

        'default_slplayer_quality',
      ]),
    })
    .file({ file });

  nconf.defaults(defaults);

  // Filter out the weird stuff
  const {
    type, $0: firstArg, _: command, modern, ...config
  } = nconf.get();

  fs.writeFileSync(file, JSON.stringify(config));

  return config;
};

module.exports = saveConfig;
