/* eslint-disable no-param-reassign */
// ABOUT
// Runs the SyncLounge Web App - handles serving the static web content and link shortening services
// Port defaults to 8088

const express = require('express');
const path = require('path');
const cors = require('cors');

const { readSettings } = require('./SettingsHelper');

const settings = readSettings();

const app = express();
const router = express.Router();

// Setup our web app
app.use(cors());

app.use(settings.webroot, router);

router.use('/', express.static(path.join(__dirname, 'dist')));

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


if (settings.authentication && settings.authentication.mechanism !== 'none') {
  console.log('Authentication:', settings.authentication);
}

if (settings.servers) {
  console.log('Servers List:', settings.servers);
} else if (settings.custom_server) {
  console.log('Custom Server List:', settings.custom_server);
}
