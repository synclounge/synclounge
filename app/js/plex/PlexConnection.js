var request = require('request');
var safeParse = require("safe-json-parse/callback")
var parseXMLString = require('xml2js').parseString;
var PlexServer = require('./PlexServer.js')
var PlexClient = require('./PlexClient.js')
var PlexTv = require('./PlexTv.js')
module.exports = function PlexConnection() {
  this.protocol = null;
  this.address = null;
  this.port = null;
  this.uri = null;
  this.local = null;
}