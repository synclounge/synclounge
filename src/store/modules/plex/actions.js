import axios from 'axios';
const request = require('request');
import xmlutils from '@/utils/xmlutils';
const parseXMLString = require('xml2js').parseString;

const _PlexAuth = require('./helpers/PlexAuth.js');
const PlexConnection = require('./helpers/PlexConnection.js');
const PlexServer = require('./helpers/PlexServer.js');
const PlexClient = require('./helpers/PlexClient.js');

const PlexAuth = new _PlexAuth();

export default {
  PLEX_LOGIN_TOKEN: ({ commit, dispatch, rootState }, token) => new Promise((resolve, reject) => {
    const options = PlexAuth.getApiOptions('https://plex.tv/users/sign_in.json', token, 5000, 'POST');
    options.headers['X-Plex-Client-Identifier'] = rootState.settings.CLIENTIDENTIFIER;
    request(options, (error, response, body) => {
      if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
        const data = JSON.parse(body);
        if (!data) {
          commit('PLEX_SET_VALUE', ['signedin', false]);
          return reject(new Error('No response data from Plex'));
        }
        commit('PLEX_SET_VALUE', ['user', data.user]);
        commit('PLEX_SET_VALUE', ['signedin', true]);
        dispatch('PLEX_GET_DEVICES');
        // state.signedin = true
        return resolve(true);
      }
      commit('PLEX_SET_VALUE', ['signedin', false]);
      return reject(error);
    });
  }),

  PLEX_LOGIN_STANDARD: ({ dispatch, commit }, data) => new Promise((resolve, reject) => {
    const { username, password } = data;
    const base64encoded = new Buffer(`${username}:${password}`).toString('base64');
    const options = {
      url: 'https://plex.tv/users/sign_in.json',
      headers: {
        Authorization: `Basic ${base64encoded}`,
        'X-Plex-Client-Identifier': 'PlexTogether',
      },
      method: 'POST',
    };
    request(options, (error, response, body) => {
      if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
        const data = JSON.parse(body);
        if (!data) {
          commit('PLEX_SET_VALUE', ['signedin', false]);
          return reject(response.statusCode);
        }
        commit('PLEX_SET_VALUE', ['user', data.user]);
        commit('PLEX_SET_VALUE', ['signedin', true]);
        dispatch('PLEX_GET_DEVICES');
      } else {
        commit('PLEX_SET_VALUE', ['signedin', false]);
        return reject(response.statusCode);
      }
    });
  }),

  PLEX_GET_DEVICES: async ({ state, commit, dispatch }, dontDelete) => {
    if (!state.user) {
      throw new Error('Sign in before getting devices');
    }

    if (!dontDelete) {
      commit('PLEX_SET_VALUE', ['gotDevices', false]);
      commit('PLEX_SET_VALUE', ['servers', {}]);
      commit('PLEX_SET_VALUE', ['clients', {}]);
    }
    try {
      const { data } = await axios.get('https://plex.tv/api/resources?includeHttps=1',
        PlexAuth.getRequestConfig(state.user.authToken, 5000));
      const result = xmlutils.parseXML(data);

      result.MediaContainer[0].Device.forEach((device) => {
      // Create a temporary array of object:PlexConnection
      // Exclude local IPs starting with 169.254
        const tempConnectionsArray = device.Connection
          .filter((connection) => !connection.address.startsWith('169.254'))
          .flatMap((connection) => {
            const tempConnection = new PlexConnection();
            Object.assign(tempConnection, connection);
            if (connection.local === '1' && connection.uri.indexOf('plex') > -1) {
              const rawConnection = new PlexConnection();
              Object.assign(rawConnection, connection);
              rawConnection.uri = `${connection.protocol}://${connection.address}:${connection.port}`;
              rawConnection.isManual = true;
              // Return both
              return [tempConnection, rawConnection];
            }

            return [tempConnection];
          });

        tempConnectionsArray.sort((con1, con2) => parseInt(con1.port, 10) - parseInt(con2.port, 10));

        // If device is a player
        if (device.provides.indexOf('player') !== -1) {
        // If device is not Plex Web
          if (device.product.indexOf('Plex Web') === -1) {
          // This is a Client
          // Create a new PlexClient object
            const tempClient = new PlexClient();
            Object.assign(tempClient, device);

            tempClient.accessToken = state.user.authToken;
            tempClient.plexConnections = tempConnectionsArray;
            dispatch('PLEX_ADD_CLIENT', tempClient);
          }
        } else if (device.provides.indexOf('server') !== -1) {
        // This is a Server
        // Create a new PlexServer object
          const tempServer = new PlexServer();
          Object.assign(tempServer, device);
          // Push a manual connection string for when DNS rebind doesnt work
          tempServer.plexConnections = tempConnectionsArray;
          if (tempServer.accessToken == null) {
            tempServer.accessToken = state.user.authToken;
          }

          dispatch('PLEX_ADD_SERVER', tempServer);
        }
      });

      // Setup our slPlayer
      const ptplayer = new PlexClient();
      ptplayer.provides = 'player';
      ptplayer.clientIdentifier = 'PTPLAYER9PLUS10';
      ptplayer.platform = 'Web';
      ptplayer.device = 'Web';
      ptplayer.product = 'SyncLounge';
      ptplayer.name = 'SyncLounge Player';
      ptplayer.labels = [['Recommended', 'green']];
      ptplayer.lastSeenAt = Math.round(new Date().getTime() / 1000);

      // Get an array of {accessToken, uri} objects
      const serverConnectionTokens = Object.entries(state.servers)
        .flatMap(([, server]) => server.plexConnections
          .map((serverConnection) => ({
            accessToken: serverConnection.accessToken,
            uri: serverConnection.uri,
          })));

      Object.entries(state.clients).forEach(([, client]) => {
        client.plexConnections.forEach((clientConnection) => {
          const match = serverConnectionTokens
            .find((serverCon) => serverCon.uri === clientConnection.uri);
          if (match !== undefined) {
          // Yeah it would be better if I didn't have to mutate client but oh well
          // eslint-disable-next-line no-param-reassign
            client.accessToken = match.accessToken;
          }
        });
      });

      dispatch('PLEX_ADD_CLIENT', ptplayer);
      commit('PLEX_SET_VALUE', ['gotDevices', true]);
      dispatch('PLEX_REFRESH_SERVER_CONNECTIONS');
    } catch (e) {
      // Invalid response
      commit('PLEX_SET_VALUE', ['gotDevices', true]);
      throw e;
    }
  },

  PLEX_REFRESH_SERVER_CONNECTIONS: ({ state, dispatch }) => {
    for (const id in state.servers) {
      const server = state.servers[id];
      dispatch('PLEX_SERVER_FINDCONNECTION', server).catch(() => {});
    }
  },

  PLEX_SERVER_FINDCONNECTION: async ({ state }, server) => server.findConnection(),

  PLEX_ADD_CLIENT: ({ commit, dispatch }, client) => {
    commit('PLEX_CLIENT_SET', client);
    commit('PLEX_CLIENT_SET_VALUE', [client, 'commit', commit]);
    commit('PLEX_CLIENT_SET_VALUE', [client, 'dispatch', dispatch]);
  },
  PLEX_ADD_SERVER: ({ commit }, server) => {
    commit('PLEX_SERVER_SET', server);
    commit('PLEX_SERVER_SET_VALUE', [server, 'commit', commit]);
  },

  PLEX_CLIENT_FINDCONNECTION: ({ commit }, client) =>
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.
    /*eslint-disable */
     new Promise(async (resolve, reject) => {
      if (client.clientIdentifier === 'PTPLAYER9PLUS10') {
        return resolve(true)
      }

      let resolved = false
      let rootResolve = resolve
      try {
        await Promise.all(client.plexConnections.map((connection) => {
          return new Promise(async (resolve, reject) => {
            try {
              try {
                await client.hitApi('/player/timeline/poll', { wait: 0 }, connection, false, true)
              } catch (e) {
                // We dont care about this result, some clients require a poll command before sending a subscription command
              }
              await client.hitApi('/player/timeline/poll', { wait: 0 }, connection)
              console.log('Got good response on', connection)
              commit('PLEX_CLIENT_SET_CONNECTION', {
                client,
                connection
              })              
              if (!resolved) {
                rootResolve()
              }
              resolved = true
              resolve()

            } catch (e) {
              resolve()
            }
          });
          
        }))
        if (!resolved) {
          console.log('Couldnt find a connection')
          return reject()
        }
        console.log('Resolved connection finder')
        return resolve() 
      } catch (e) {
        console.log('Error connecting to client', e)
        reject(e)
      }
    }), /* eslint-enable */


  PLEX_CLIENT_UPDATETIMELINE: ({}, data) => {
    const [client, timeline] = data;
    console.log('Updating timeline for', client, 'with', timeline);
  },

  PLEX_GET_SERVERS: ({ state, commit, dispatch }, token) => new Promise((resolve, reject) => {
    if (!state.user) {
      return reject(new Error('Sign in before getting devices'));
    }

    const options = PlexAuth.getApiOptions('https://plex.tv/pms/servers.xml', token, 5000, 'GET');
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        // Valid response
        parseXMLString(body, async (err, result) => {
          if (err) {
            return reject(err);
          }
          // Save the servers list associated with the logged in account
          state.user.servers = result.MediaContainer.Server;
          return resolve(true);
        });
      }
      return reject(error);
    });
  }),

};
