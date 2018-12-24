const request = require('request');
const safeParse = require('safe-json-parse/callback');
const parseXMLString = require('xml2js').parseString;
const http = require('http');

const PlexServer = require('./PlexServer.js');
const PlexClient = require('./PlexClient.js');
const PlexConnection = require('./PlexConnection.js');
const _PlexAuth = require('./PlexAuth.js');

const PlexAuth = new _PlexAuth();

module.exports = function () {
  this.signedin = false;
  this.plextvdata = {};
  this.gotDevices = false;

  this.user = {};
  this.username = null;
  this.all_devices = [];
  this.servers = [];
  this.clients = [];
  this.checkedClients = [];

  this.chosenClient = null;
  this.chosenServer = null;

  this.httpServer = null;
  this.httpServerPort = 1;

  // Functions
  this.getPort = function () {
    this.httpServerPort = 8082;
  };
  this.loginUserPass = function (_username, _password, callback) {
    const that = this;
    this.doStandardLogin(_username, _password, (result) => {
      if (result === 200 || result === 201) {
        // Login successful!
        that.signedin = true;
        return (callback(true));
      }
      return (callback(false));
    });
  };
  this.loginToken = function (token, callback) {
    const that = this;
    this.doTokenLogin(token, (result) => {
      if (result === 200 || result === 201) {
        // Login successful!
        that.signedin = true;
        return (callback(true));
      }
      return (callback(false));
    });
  };

  this.doTokenLogin = function (token, callback) {
    var that = this;
    // Login via a token, this is the normal login path after
    // the initial setup
    const options = PlexAuth.getApiOptions('https://plex.tv/users/sign_in.json', token, 5000, 'POST');
    var that = this;
    request(options, (error, response, body) => {
      if (!error && (response.statusCode === 200 || response.statusCode == 201)) {
        safeParse(body, (err, json) => {
          if (err) {
            that.signedin = false;
            return (callback(false, response, body));
          }
          that.signedin = true;
          that.user = json.user;
          return (callback(true, response, body));
        });
      } else {
        const code = response.statusCode;
        if (code === 401) {
          that.signedin = false;
          return (callback(false, response, body));
        }
        that.signedin = false;
        return (callback(false, response, body));
      }
    });
  };
  this.doStandardLogin = function (username, password, _callback) {
    // Sign in to Plex.tv via plex.tv/users/sign_in.json via POST
    const base64encoded = new Buffer(`${username}:${password}`).toString('base64');
    const options = {
      url: 'https://plex.tv/users/sign_in.json',
      headers: {
        Authorization: `Basic ${base64encoded}`,
        'X-Plex-Client-Identifier': global.constants.X_PLEX_CLIENT_IDENTIFIER,
      },
      method: 'POST',
    };
    const that = this;
    request(options, (error, response, body) => {
      if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
        safeParse(body, (err, json) => {
          that.user = json.user;
          that.signedin = true;
          return (_callback(response.statusCode));
        });
      } else {
        const code = response.statusCode;
        if (code == 401) {
          that.signedin = false;
          return (_callback(response.statusCode));
        }
        that.signedin = false;
        return (_callback(response.statusCode));
      }
    });
  };
  this.getClientById = function (clientId, callback) {
    for (const i in this.clients) {
      const client = this.clients[i];
      if (client.clientIdentifier == clientId) {
        return callback(client);
      }
    }
    return callback(null);
  };
  this.getServerById = function (clientId) {
    for (const i in this.servers) {
      const server = this.servers[i];
      if (server.clientIdentifier == clientId) {
        return server;
      }
    }
    return null;
  };
  this.getRandomThumb = function (callback) {
    const ticker = (failures) => {
      setTimeout(() => {
        if (failures === 10) {
          return callback(false);
        }
        const validServers = this.servers.filter(server => server.chosenConnection);
        if (validServers.length > 1) {
          const randomServer = validServers[Math.floor(Math.random() * validServers.length)];
          randomServer.getRandomItem((result) => {
            console.log('Random item result', result);
            if (!result) {
              return callback(false);
            }
            return callback(randomServer.getUrlForLibraryLoc(result.thumb, 900, 900, 8));
          });
        } else {
          ticker(failures + 1);
        }
      }, 100);
    };
    ticker(0);
  };
  this.playContentAutomatically = function (client, hostData, blockedServers, offset, callback) {
    // Automatically play content on the client searching all servers based on the title
    const that = this;

    // First lets find all of our playable items
    const playables = [];
    let j = 0;

    let validServers = this.servers.length;
    if (blockedServers) {
      for (let i = 0; i < blockedServers.length; i++) {
        if (this.servers[blockedServers[i]]) {
          validServers--;
        }
      }
    }
    if (validServers == 0) {
      return callback(false);
    }
    for (let i = 0; i < this.servers.length; i++) {
      const server = this.servers[i];
      let blocked = false;
      if (blockedServers) {
        for (let i = 0; i < blockedServers.length; i++) {
          if (blockedServers[i] == server.clientIdentifier) {
            blocked = true;
          }
        }
      }
      if (blocked) {
        continue;
      }
      server.search(hostData.rawTitle, (results, _server) => {
        j++;
        if (results != null) {
          for (let k = 0; k < results.length; k++) {
            // Now we need to check the result
            if (checkResult(results[k], hostData)) {
              // Its a match!
              playables.push({
                server: _server,
                result: results[k],
              });
            }
          }
        }

        if (j == validServers) {
          start(playables, 0);
        }
      });
    }

    function start(playables, index) {
      // Now lets try and play our items one by one
      if (playables.length == 0) {
        return callback(false);
      }
      const server = playables[index].server;
      const ratingKey = playables[index].result.ratingKey;
      const data = {
        ratingKey,
        mediaIndex: null,
        server,
        offset: offset || 0,
        callback(playResult, code) {
          if (code == 200) {
            return callback(true);
          }
          return start(playables, parseInt(parseInt(index) + 1));
        },
      };
      if (client.clientIdentifier == 'PTPLAYER9PLUS10') {
        client.playMedia(data);
      } else {
        // Standard Plex Player
        client.subscribe((result) => {
          client.playMedia(data);
        });
      }
    }

    function checkResult(data, hostData) {
      // Do a series of checks to see if this result is OK
      // Check if rawTitle matches
      if (data.title != hostData.rawTitle) {
        // global.renderLog.info('wrong title')
        return false;
      }
      // Check if length is close enough
      if (Math.abs(parseInt(data.duration) - parseInt(hostData.maxTime)) > 5000 || !data.duration) {
        // global.renderLog.info('wrong time')
        return false;
      }
      if (data.type == 'movie') {
        // We're good!
        return true;
      }
      if (data.type == 'episode') {
        // Check if the show name is the same
        return true;
      }
      if (data.type == 'track') {
        // We're good!
        return true;
      }
      return false;
    }
  },

  this.createHttpServer = function () {

  };
  this.getPort();
};
