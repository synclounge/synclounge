const nconf = require('nconf');
const fs = require('fs');

const defaults = require('./defaults');

const omit = (keys, obj) => keys.reduce((a, e) => {
  const { [e]: no, ...rest } = a;
  return rest;
}, obj);

// Doesn't return the keys specified in the blockList
const get = (file, blockList = []) => {
  // Clear out nconf memory in case another dependency used it before
  nconf.reset();

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

        'authentication__mechanism',
        'authentication__type',
        'authentication__authorized',

        'custom_server__name',
        'custom_server__location',
        'custom_server__url',
        'custom_server__image',

        'default_slplayer_quality',
      ]),
    });

  const configFile = nconf.get('config_file') || file;

  if (configFile) {
    nconf.file({ file: configFile });
  }

  nconf.defaults(defaults);

  // Filter out the weird stuff
  const {
    config_file: no, type, $0: firstArg, _: command, modern, ...config
  } = nconf.get();

  // Remove blockList items
  const filteredConfig = omit(blockList, config);
  return filteredConfig;
};

// Saves the give config json to the specified file
const save = (config, file) => {
  fs.writeFileSync(file, JSON.stringify(config));
};

module.exports = {
  get,
  save,
};
