// ABOUT
// Runs the SyncLounge Web App - handles serving the static web content and link shortening services
// Port defaults to 8088
// REQUIRED: Access URL must be set. See documentation for how to set this.

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const Waterline = require('waterline');
const SailsMysql = require('sails-mysql');
const SailsDisk = require('sails-disk');

const { readSettings } = require('./SettingsHelper');

const settings = readSettings();

const bootstrap = () => {
  if (!settings.accessUrl) {
    console.log(
      'Missing required argument `accessUrl`. This URL is used for redirecting invite links. See documentation for how to set this',
    );
    return Promise.reject(new Error('Missing URL for invite links'));
  }

  const baseSettings = require('./waterline_settings.json');
  // console.log('Basesettings', baseSettings);
  baseSettings.waterline.adapters = {
    'sails-mysql': SailsMysql,
    'sails-disk': SailsDisk,
  };

  baseSettings.waterline.datastores = baseSettings.database.datastores;
  baseSettings.waterline.models.invite.beforeCreate = (data, cb) => {
    console.log('Creating Invite', data);
    const params = {
      server: data.server,
      room: data.room,
      owner: data.owner,
    };
    if (data.password) {
      params.password = data.password;
    }

    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${value}`)
      .join('&');

    // TODO: ask why we require accessUrl and not just redirect relatively
    const fullUrl = `${settings.accessUrl}/#/join?${query}`;
    data.fullUrl = fullUrl;
    // eslint-disable-next-line no-bitwise
    data.code = (0 | (Math.random() * 9e6)).toString(36);
    cb();
  };

  return new Promise((resolve, reject) => {
    Waterline.start(baseSettings.waterline, (err, orm) => {
      if (err) {
        return reject(err);
      }
      return resolve(orm);
    });
  });
};

const webApp = async (orm) => {
  const app = express();
  const router = express.Router();

  // Setup our web app
  app.use(cors());

  // Allow body to be json or urlencoded
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  app.use(settings.webroot, router);

  router.use('/', express.static(path.join(__dirname, 'dist')));

  // Invite handling
  router.get('/invite/:id', async (req, res) => {
    console.log('handling an invite', req.params.id);
    const shortObj = await Waterline.getModel('invite', orm).findOne({ code: req.params.id });
    console.log('Invite data', shortObj);
    if (!shortObj) {
      return res.redirect(settings.accessUrl + settings.webroot);
    }
    console.log('Redirecting an invite link', shortObj);
    return res.redirect(shortObj.fullUrl);
  });

  router.post('/invite', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.body) {
      return res
        .send({
          success: false,
          msg: 'ERR: You did not send any POST data',
        })
        .end();
    }

    const fields = ['server', 'room', 'password', 'owner'];

    const missingField = fields.find((field) => req.body[field] === undefined);
    if (missingField !== undefined) {
      return res
        .send({
          success: false,
          msg: `ERR: You did not specify ${missingField}`,
          field: missingField,
        })
        .end();
    }

    const data = fields.reduce((dataAcc, field) => {
      dataAcc[field] = req.body[field];
      return dataAcc;
    }, {});

    const result = await Waterline.getModel('invite', orm)
      .create({ ...data })
      .fetch();

    return res
      .send({
        url: `${settings.accessUrl}/invite/${result.code}`,
        success: true,
        generatedAt: new Date().getTime(),
        details: result,
      })
      .end();
  });

  // Config handling
  router.get('/config', (req, res) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.send(settings);
  });

  // Catch anything else and redirect to the base URL
  router.get('*', (req, res) => {
    console.log('Catch all:', req.url);
    return res.redirect(`${settings.webroot}/`);
  });

  app.listen(settings.webapp_port, () => {
    console.log('SyncLounge WebApp successfully started on port ', settings.webapp_port);
  });


  console.log('Running with base URL: ', settings.webroot);

  if (settings.accessUrl) {
    console.log(`Access URL is ${settings.accessUrl}`);
    if (settings.webroot && !settings.accessUrl.includes(settings.webroot)) {
      console.log('- WARNING: Your Access URL does not contain your webroot/WEBROOT setting: ',
        settings.webroot, '. Invite URLs may not work properly.');
    }
  }

  if (settings.authentication && settings.authentication.mechanism !== 'none') {
    console.log('Authentication:', settings.authentication);
  }

  if (settings.servers) {
    console.log('Servers List:', settings.servers);
  } else if (settings.custom_server) {
    console.log('Custom Server List:', settings.custom_server);
  }
};

bootstrap()
  .then((orm) => {
    webApp(orm);
  })
  .catch((e) => {
    console.log('Error bootstrapping webapp:', e);
  });