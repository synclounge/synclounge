import axios from 'axios';

import PlexServer from './helpers/PlexServer';
import PlexClient from './helpers/PlexClient';

const PlexConnection = require('./helpers/PlexConnection.js');


export default {
  REQUEST_PLEX_INIT_AUTH: ({ getters }) => axios.post('https://plex.tv/api/v2/pins?strong=true', null, {
    headers: getters.GET_PLEX_INITIAL_AUTH_PARAMS,
  }).then(({ data }) => data),

  REQUEST_PLEX_AUTH_TOKEN: async ({ getters, commit, dispatch }, id) => {
    const { data } = await axios.get(`https://plex.tv/api/v2/pins/${id}`, {
      headers: getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    });

    if (!data.authToken) {
      throw new Error("Plex didn't give authToken");
    }

    commit('settings/SET_PLEX_AUTH_TOKEN', data.authToken, { root: true });

    // TODO: fetch this on demand and stuff
    await dispatch('FETCH_PLEX_USER');
  },

  FETCH_PLEX_USER: async ({ getters, commit }) => {
    const { data } = await axios.get('https://plex.tv/users/account.json', {
      headers: getters.GET_PLEX_BASE_PARAMS,
    });

    commit('settings/SET_PLEX_USER', data.user, { root: true });
  },

  PLEX_GET_DEVICES: async ({
    state, commit, dispatch, getters, rootGetters,
  }, dontDelete) => {
    if (!dontDelete) {
      commit('PLEX_SET_VALUE', ['gotDevices', false]);
      commit('PLEX_SET_VALUE', ['servers', {}]);
      commit('PLEX_SET_VALUE', ['clients', {}]);
    }
    try {
      const { data: devices } = await axios.get('https://plex.tv/api/v2/resources?includeHttps=1', {
        headers: getters.GET_PLEX_BASE_PARAMS,
      });

      devices.forEach((device) => {
      // Create a temporary array of object:PlexConnection
        const tempConnectionsArray = device.connections
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

        tempConnectionsArray.sort(
          (con1, con2) => parseInt(con1.port, 10) - parseInt(con2.port, 10),
        );

        // If device is a player
        if (device.provides.indexOf('player') !== -1) {
        // If device is not Plex Web
          if (device.product.indexOf('Plex Web') === -1) {
          // This is a Client
          // Create a new PlexClient object
            const tempClient = new PlexClient();
            Object.assign(tempClient, device);

            tempClient.accessToken = rootGetters['settings/GET_PLEX_AUTH_TOKEN'];
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
          if (tempServer.accessToken === null) {
            tempServer.accessToken = rootGetters['settings/GET_PLEX_AUTH_TOKEN'];
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

  PLEX_REFRESH_SERVER_CONNECTIONS: ({ state, dispatch }) => Promise.allSettled(
    Object.entries(state.servers)
      .map(([, server]) => dispatch('PLEX_SERVER_FINDCONNECTION', server)),
  ).catch(() => {}),

  PLEX_SERVER_FINDCONNECTION: (context, server) => server.findConnection(),

  PLEX_ADD_CLIENT: ({ commit, dispatch }, client) => {
    commit('PLEX_CLIENT_SET', client);
    commit('PLEX_CLIENT_SET_VALUE', [client, 'commit', commit]);
    commit('PLEX_CLIENT_SET_VALUE', [client, 'dispatch', dispatch]);
  },
  PLEX_ADD_SERVER: ({ commit }, server) => {
    commit('PLEX_SERVER_SET', server);
    commit('PLEX_SERVER_SET_VALUE', [server, 'commit', commit]);
  },

  PLEX_CLIENT_FINDCONNECTION: async ({ commit }, client) => {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.

    if (client.clientIdentifier === 'PTPLAYER9PLUS10') {
      return true;
    }

    try {
      await Promise.any(client.plexConnections.map(async (connection) => {
        // We dont care about this result, some clients require a poll command before sending a subscription command
        await client.hitApi('/player/timeline/poll', { wait: 0 }, connection, false, true)
          .catch(() => { });

        await client.hitApi('/player/timeline/poll', { wait: 0 }, connection);

        console.log('Got good response on', connection);
        commit('PLEX_CLIENT_SET_CONNECTION', { client, connection });
      }));

      return true;
    } catch (e) {
      console.error('Error connecting to client', e);
      throw e;
    }
  },

  PLEX_CLIENT_UPDATETIMELINE: (context, [client, timeline]) => {
    console.log('Updating timeline for', client, 'with', timeline);
  },

  PLEX_CHECK_AUTH: async ({ state, dispatch, getters }, authToken) => {
    await dispatch('PLEX_LOGIN_TOKEN', authToken);
    // Get stored authentication settings
    const authentication = getters['config/GET_AUTHENTICATION'];
    // Authentication defaults to false
    let authenticationPassed = false;

    if (authentication) {
      // Authenication via Plex mechanism
      if (authentication.mechanism === 'plex') {
        // Server authorization using server data
        if (authentication.type.includes('server')) {
          try {
            // Retrieve and store the user's servers
            await dispatch('PLEX_GET_DEVICES', true);
            // Get the user's servers

            // Compare servers against the authorized list
            // https://stackoverflow.com/a/43820518/10054627
            // TODO: make sure I did this right. test it pls
            if (state.plex.servers.some(Set.prototype.has, new Set(authentication.authorized))) {
              authenticationPassed = true;
            }
          } catch (e) {
            console.error('An error occurred when authenticating with Plex: ', e);
          }
        }
        // Authorization using user data
        if (authentication.type.includes('user')) {
          // Get the user object
          const { user } = state.plex;
          // Compare the user's email against the authorized list
          if (authentication.authorized.includes(user.email)) {
            authenticationPassed = true;
          }
          // Compare the user's name against the authorized list
          if (authentication.authorized.includes(user.username)) {
            authenticationPassed = true;
          }
        }
      } else if (authentication.mechanism !== 'none') {
        console.error(
          `Invalid authentication mechanism provided: '${authentication.mechanism}'. Reverting to default.`,
        );
        authenticationPassed = true;
      } else {
        // Authenication mechanism isn't set. This should only happen when authentication mechanism is set to 'none'.
        console.log('No authentication set');
        authenticationPassed = true;
      }
      return authenticationPassed;
    }

    // Fallback if authentication isn't set
    return true;
  },

  getRandomThumb: async ({ getters }) => {
    const validServers = getters.GET_VALID_SERVERS;

    if (Object.keys(validServers).length > 1) {
      const keys = Object.keys(validServers);
      const randomServer = validServers[keys[Math.floor(keys.length * Math.random())]];
      const result = await randomServer.getRandomItem();
      if (!result) {
        throw new Error('No result found');
      }

      return randomServer.getUrlForLibraryLoc(result.thumb, 900, 900, 8);
    }

    throw new Error('No valid servers found');
  },
};
