#!/usr/bin/env node

const saveConfig = require('./index');

const config = saveConfig('dist/config.json');
console.log(config);
