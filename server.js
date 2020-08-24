#!/usr/bin/env node

const syncloungeSocket = require('syncloungesocket');
const config = require('./config');

// Using a single function to handle multiple signals
const handle = (signal) => {
  console.log(`Received ${signal}. Exiting`);
  process.exit(0);
};

process.on('SIGINT', handle);
process.on('SIGTERM', handle);

const configFile = 'dist/config.json';
const blockList = Object.keys(syncloungeSocket.defaultConfig);
const appConfig = config.get(configFile, blockList);
console.log(appConfig);
config.save(appConfig, configFile);

const socketConfig = syncloungeSocket.getConfig();
syncloungeSocket.socketServer(socketConfig);
