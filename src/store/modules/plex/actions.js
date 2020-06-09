import axios from 'axios';
import promiseutils from '@/utils/promiseutils';
import { sample } from 'lodash-es';

import PlexServer from './helpers/PlexServer';
import PlexClient from './helpers/PlexClient';


export default {
  REQUEST_PLEX_INIT_AUTH: ({ getters }) => axios.post('https://plex.tv/api/v2/pins', null, {
    headers: getters.GET_PLEX_INITIAL_AUTH_PARAMS,
    params: {
      strong: true,
    },
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
    const { data } = await axios.get('https://plex.tv/api/v2/user', {
      params: {
        includeSubscriptions: 1,
        includeProviders: 1,
        includeSettings: 1,
        includeSharedSettings: 1,
      },
      headers: getters.GET_PLEX_BASE_PARAMS(),
    });

    commit('settings/SET_PLEX_USER', data, { root: true });
  },

  PLEX_GET_DEVICES: async ({
    commit, dispatch, getters, rootGetters,
  }) => {
    try {
      const { data: devices } = await axios.get('https://plex.tv/api/v2/resources', {
        params: {
          includeHttps: 1,
          includeRelay: 1,
        },
        headers: getters.GET_PLEX_BASE_PARAMS(),
      });

      await Promise.allSettled(devices.map(async (device) => {
      // Create a temporary array of object:PlexConnection

        // If device is a player
        if (device.provides.indexOf('player') !== -1) {
          // This is a Client
          // Create a new PlexClient object
          const tempClient = new PlexClient(device);

          tempClient.accessToken = rootGetters['settings/GET_PLEX_AUTH_TOKEN'];
          tempClient.commit = commit;
          dispatch('PLEX_ADD_CLIENT', tempClient);
        } else if (device.provides.indexOf('server') !== -1) {
        // This is a Server
        // Create a new PlexServer object
          const tempServer = new PlexServer();
          Object.assign(tempServer, device);
          // Push a manual connection string for when DNS rebind doesnt work

          tempServer.chosenConnection = await dispatch('FIND_WORKING_CONNECTION', { connections: device.connections, accessToken: tempServer.accessToken }).catch(() => null);
          tempServer.commit = commit;
          console.log('CHOSEN CONN: ', tempServer.chosenConnection);

          commit('PLEX_ADD_SERVER', tempServer);
        }
      }));


      dispatch('PLEX_ADD_CLIENT', getters.GET_SL_PLAYER);
      commit('PLEX_SET_VALUE', ['gotDevices', true]);
    } catch (e) {
      // Invalid response
      commit('PLEX_SET_VALUE', ['gotDevices', true]);
      throw e;
    }
  },

  PLEX_ADD_CLIENT: ({ commit }, client) => {
    commit('PLEX_CLIENT_SET', client);
  },

  PLEX_CLIENT_FINDCONNECTION: async ({ commit }, client) => {
    // TODO: use this to authenticate again lol
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
            await dispatch('PLEX_GET_DEVICES');
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

  getRandomThumb: async ({ getters, dispatch }) => {
    if (getters.GET_CONNECTABLE_PLEX_SERVERS.length <= 0) {
      await dispatch('PLEX_GET_DEVICES');
    }

    const randomServer = sample(getters.GET_CONNECTABLE_PLEX_SERVERS);
    if (!randomServer) {
      throw new Error('No valid servers found');
    }

    const result = await randomServer.getRandomItem();
    if (!result) {
      throw new Error('No result found');
    }

    return randomServer.getUrlForLibraryLoc(result.thumb, 900, 900, 8);
  },

  TEST_PLEX_CONNECTION: ({ getters }, { connection, accessToken }) => axios.get(`${connection.uri}/media/providers`, {
    headers: getters.GET_PLEX_BASE_PARAMS(accessToken),
    timeout: 7500,
  }),

  FIND_WORKING_CONNECTION: async ({ dispatch }, { connections, accessToken }) => {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.

    const nonRelayConnections = connections.filter((connection) => !connection.relay);
    // Prefer secure connections first.
    const secureConnections = nonRelayConnections.filter((connection) => connection.protocol === 'https');
    const insecureConnections = nonRelayConnections.filter((connection) => connection.protocol === 'http');

    try {
      const secureConnection = await promiseutils.any(
        secureConnections.map((connection) => dispatch('TEST_PLEX_CONNECTION', { connection, accessToken }).then(() => connection)),
      );
      return secureConnection;
    } catch (e) {
      console.log('No secure connections found');
    }

    // If we are using synclounge over https, we can't access connections over http because
    // most modern web browsers block mixed content

    try {
      const insecureConnection = await promiseutils.any(insecureConnections.map((connection) => dispatch('TEST_PLEX_CONNECTION', { connection, accessToken }).then(() => connection)));
      return insecureConnection;
    } catch (e) {
      console.log('No insecure connections found');
    }

    // Finally try relay connections if we failed everywhere else.
    const relayConnections = connections.filter((connection) => connection.relay);
    return promiseutils.any(relayConnections.map((connection) => dispatch('TEST_PLEX_CONNECTION', { connection, accessToken }).then(() => connection)));
  },
};
