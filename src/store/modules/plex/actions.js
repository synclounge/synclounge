import promiseutils from '@/utils/promiseutils';
import { fetchJson, queryFetch } from '@/utils/fetchutils';

export default {
  FETCH_PLEX_INIT_AUTH: async ({ getters }, signal) => fetchJson(
    'https://plex.tv/api/v2/pins',
    { strong: true },
    {
      method: 'POST',
      headers: getters.GET_PLEX_INITIAL_AUTH_PARAMS,
      signal,
    },
  ),

  REQUEST_PLEX_AUTH_TOKEN: async ({ getters, commit, dispatch }, { signal, id }) => {
    const data = await fetchJson(
      `https://plex.tv/api/v2/pins/${id}`,
      null,
      {
        headers: getters.GET_PLEX_INITIAL_AUTH_PARAMS,
        signal,
      },
    );

    if (!data.authToken) {
      throw new Error("Plex didn't give authToken");
    }

    commit('SET_PLEX_AUTH_TOKEN', data.authToken);

    await dispatch('FETCH_PLEX_USER', signal);
  },

  FETCH_PLEX_USER: async ({ getters, commit }, signal) => {
    const data = await fetchJson('https://plex.tv/api/v2/user', {
      ...getters.GET_PLEX_BASE_PARAMS(),
      includeSubscriptions: 1,
      includeProviders: 1,
      includeSettings: 1,
      includeSharedSettings: 1,
    }, { signal });

    commit('SET_PLEX_USER', data);
  },

  // Private function, please use FETCH_PLEX_DEVICES instead
  _FETCH_PLEX_DEVICES: async ({ commit, dispatch, getters }) => {
    const devices = await fetchJson('https://plex.tv/api/v2/resources', {
      ...getters.GET_PLEX_BASE_PARAMS(),
      includeHttps: 1,
      includeRelay: 1,
    });

    await Promise.allSettled(devices.map(async (device) => {
      if (device.provides.indexOf('player') !== -1) {
        // This is a Client
        commit('plexclients/ADD_PLEX_CLIENT', device, { root: true });
      } else if (device.provides.indexOf('server') !== -1) {
        // This is a Server
        // TODO: potentially find connections async and not hold up the fetch devices
        const chosenConnection = await dispatch('FIND_WORKING_CONNECTION_PREFERRED', {
          connections: device.connections,
          accessToken: device.accessToken,
        }).catch(() => null);

        commit('plexservers/ADD_PLEX_SERVER', {
          ...device,
          chosenConnection,
        }, { root: true });
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

  TEST_PLEX_CONNECTION: async ({ getters }, { connection, accessToken, signal }) => {
    await queryFetch(
      connection.uri,
      getters.GET_PLEX_BASE_PARAMS(accessToken),
      { signal },
    );

    return connection;
  },

  FIND_WORKING_CONNECTION: async ({ dispatch }, { connections, accessToken }) => {
    const controller = new AbortController();
    const workingConnection = await promiseutils.any(
      connections.map((connection) => dispatch(
        'TEST_PLEX_CONNECTION',
        { connection, accessToken, signal: controller.signal },
      )),
    );

    // Abort other connection attempts since we found one
    controller.abort();

    return workingConnection;
  },

  FIND_WORKING_CONNECTION_PREFERRED: async ({ dispatch }, { connections, accessToken }) => {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.

    const nonRelayConnections = connections.filter((connection) => !connection.relay);
    // Prefer secure connections first.
    const secureConnections = nonRelayConnections.filter((connection) => connection.protocol
      === 'https');

    try {
      return dispatch('FIND_WORKING_CONNECTION', { connections: secureConnections, accessToken });
    } catch (e) {
      console.warn('No secure connections found');
    }

    // If we are using synclounge over https, we can't access connections over http because
    // most modern web browsers block mixed content
    const insecureConnections = nonRelayConnections.filter((connection) => connection.protocol
      === 'http');
    try {
      return dispatch('FIND_WORKING_CONNECTION', { connections: insecureConnections, accessToken });
    } catch (e) {
      console.warn('No insecure connections found');
    }

    // TODO: display better errors for this

    // Finally try relay connections if we failed everywhere else.
    const relayConnections = connections.filter((connection) => connection.relay);
    return dispatch('FIND_WORKING_CONNECTION', { connections: relayConnections, accessToken });
  },
};
