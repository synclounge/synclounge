// ABOUT
// Runs the SyncLounge Web App - handles serving the static web content and link shortening services
// Port defaults to 8088
// REQUIRED: --url argument

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const Waterline = require('waterline');
const WaterlineMysql = require('waterline-mysql');
const SailsDisk = require('sails-disk');

const SettingsHelper = require('./SettingsHelper');

const settings = new SettingsHelper();
console.log('Settings', settings);
let accessIp = '';
let PORT = 8088;

const bootstrap = () => new Promise(async (resolve, reject) => {
  const args = require('args-parser')(process.argv);
  if (!settings.accessUrl) {
    console.log('Missing required argument -accessUrl. EG. "node webapp.js -accessUrl=http://sl.example.com". This URL is used for redirecting invite links.');
    return reject(new Error('Missing URL for invite links'));
  }
  accessIp = settings.accessUrl;// EG 'http://95.231.444.12:8088/slweb' or 'http://example.com/slweb'
  if (args.webapp_port || process.env.webapp_port) {
    PORT = args.webapp_port || process.env.webapp_port;
  } else {
    console.log('Defaulting webapp to port 8088');
  }
  PORT = parseInt(PORT);
  const baseSettings = require('./waterline_settings.json');
  console.log('Basesettings', baseSettings);
  baseSettings.waterline.adapters = {
    'waterline-mysql': WaterlineMysql,
    'sails-disk': SailsDisk,
  };
  baseSettings.waterline.datastores = baseSettings.database.datastores;
  baseSettings.waterline.models.invite.beforeCreate = async (data, cb) => {
    console.log('Creating Invite', data);
    let fullUrl;
    const params = {
      server: data.server,
      room: data.room,
      owner: data.owner,
    };
    if (data.password) {
      params.password = data.password;
    }
    let query = '';
    for (const key in params) {
      query += `${encodeURIComponent(key)}=${params[key]}&`;
    }
    fullUrl = `${accessIp}/#/join?${query}`;
    data.fullUrl = fullUrl;
    data.code = (0 | Math.random() * 9e6).toString(36);
    cb();
  };
  Waterline.start(baseSettings.waterline, (err, orm) => {
    if (err) {
      return reject(err);
    }
    resolve(orm);
  });
});

const app = async (orm) => {
  const root = express();
  root.use(cors());
  root.use(bodyParser());
  // Setup our web app
  root.use(`${settings.webroot}/`, express.static(path.join(__dirname, 'dist')));
  root.get(`${settings.webroot}/invite/:id`, async (req, res) => {
    console.log('handling an invite', req.params.id);
    const shortObj = await Waterline.getModel('invite', orm).findOne({ code: req.params.id });
    console.log('Invite data', shortObj);
    if (!shortObj) {
      return res.redirect(accessIp + settings.webroot);
    }
    console.log('Redirecting an invite link', shortObj);
    return res.redirect(shortObj.fullUrl);
  });
  root.post(`${settings.webroot}/invite`, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.body) {
      return res.send({
        success: false,
        msg: 'ERR: You did not send any POST data',
      }).end();
    }
    const data = {};
    const fields = ['server', 'room', 'password', 'owner'];
    for (let i = 0; i < fields.length; i++) {
      if (req.body[fields[i]] === undefined) {
        return res.send({
          success: false,
          msg: `ERR: You did not specify ${fields[i]}`,
          field: fields[i],
        }).end();
      }
      data[fields[i]] = req.body[fields[i]];
    }
    const result = await Waterline.getModel('invite', orm).create({ ...data }).fetch();
    return res.send({
      url: `${accessIp}/invite/${result.code}`,
      success: true,
      generatedAt: new Date().getTime(),
      details: result,
    }).end();
  });
  root.get(`${settings.webroot}/config`, (req, res) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.send(SettingsHelper())
  });
  root.use('/', express.static(path.join(__dirname, 'dist')));
  root.get('*', (req, res) => {
    console.log('Catch all');
    return res.redirect('/');
  });
  root.use(cors());
  const rootserver = require('http').createServer(root);
  rootserver.listen(PORT);
  console.log(`SyncLounge WebApp successfully started on port ${PORT}`);
};

bootstrap().then((orm) => {
  app(orm);
}).catch((e) => {
  console.log('Error bootstrapping webapp:', e);
});
