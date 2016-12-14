'use strict';

// const remote = require('remote');
const {
  ipcRenderer
} = require('electron');
var path = require('path');
var splashLog = require('electron-log')
splashLog.transports.file.format = '[Splash] [{level}] {h}:{i}:{s}:{ms} {text}'
ipcRenderer.on('splash-update-status', function(event, msg) {
  splashLog.info('msg: ' + msg)
  document.getElementById('splashStatus').innerHTML = msg
})