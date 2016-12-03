'use strict';

// const remote = require('remote');
const {ipcRenderer} = require('electron');
var path = require('path');

var closeEl = document.querySelector('.close');
var settingsEl = document.querySelector('.settings');
var signinEl = document.querySelector('.signin');

signinEl.addEventListener('click', function() {
    console.log('Hello world');
});
