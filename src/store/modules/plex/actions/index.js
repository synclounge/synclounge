import axios from 'axios';

import promiseutils from '@/utils/promiseutils';

import PlexServer from '../helpers/PlexServer';
import PlexClient from '../helpers/PlexClient';

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

    commit('SET_PLEX_USER', data);
  },

  // Private function, please use FETCH_PLEX_DEVICES instead
  _FETCH_PLEX_DEVICES: async ({
    commit, dispatch, getters, rootGetters,
  }) => {
    const { data: devices } = await axios.get('https://plex.tv/api/v2/resources', {
      params: {
        includeHttps: 1,
        includeRelay: 1,
      },
      headers: getters.GET_PLEX_BASE_PARAMS(),
    });

    await Promise.allSettled(devices.map(async (device) => {
      if (device.provides.indexOf('player') !== -1) {
        // This is a Client
        const tempClient = new PlexClient(device);
        tempClient.accessToken = rootGetters['settings/GET_PLEX_AUTH_TOKEN'];
        tempClient.commit = commit;
        commit('PLEX_ADD_CLIENT', tempClient);
      } else if (device.provides.indexOf('server') !== -1) {
        // This is a Server
        const tempServer = new PlexServer(device);
        tempServer.commit = commit;
        tempServer.chosenConnection = await dispatch('FIND_WORKING_CONNECTION', {
          connections: device.connections,
          accessToken: tempServer.accessToken,
        }).catch(() => null);

        commit('PLEX_ADD_SERVER', tempServer);
      }
    }));

    if (!getters.IS_DONE_FETCHING_DEVICES) {
      commit('SET_DONE_FETCHING_DEVICES', true);
    }
  },

  FETCH_PLEX_DEVICES: async ({ getters, commit, dispatch }) => {
    // If we already have started checking for devices,
    // wait for that to finish instead of starting new request
    if (!getters.GET_DEVICE_FETCH_PROMISE) {
      const fetchPromise = dispatch('_FETCH_PLEX_DEVICES');
      commit('SET_DEVICE_FETCH_PROMISE', fetchPromise);
    }

    await getters.GET_DEVICE_FETCH_PROMISE;
    commit('SET_DEVICE_FETCH_PROMISE', null);
  },

  // Use this to trigger a fetch if you don't need the devices refreshed
  FETCH_PLEX_DEVICES_IF_NEEDED: async ({ getters, dispatch }) => {
    if (!getters.IS_DONE_FETCHING_DEVICES) {
      await dispatch('FETCH_PLEX_DEVICES');
    }
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
