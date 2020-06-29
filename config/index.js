const nconf = require('nconf');
const defaults = require('./defaults');

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
  .file({ file: 'config.json' });

nconf.defaults(defaults);

module.exports = nconf;
