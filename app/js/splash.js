'use strict';

// const remote = require('remote');
const {ipcRenderer} = require('electron');
var path = require('path');

ipcRenderer.on('splash-update-status', function(event, msg){
    console.log('msg: ' + msg)
    document.getElementById('splashStatus').innerHTML = msg
})   
