import axios from 'axios';
import socketConnect from '@/utils/socketconnect';
import guid from '@/utils/guid';
import eventhandlers from '@/store/modules/synclounge/eventhandlers';
import combineUrl from '@/utils/combineurl';
import cancelablePeriodicTask from '@/utils/cancelableperiodictask';

export default {
  CONNECT_AND_JOIN_ROOM: async ({ getters, dispatch }) => {
    await dispatch('ESTABLISH_SOCKET_CONNECTION');
    await dispatch('JOIN_ROOM_AND_INIT');

    // Add this item to our recently-connected list
    await dispatch(
      'ADD_RECENT_ROOM',
      {
        server: getters.GET_SERVER,
        room: getters.GET_ROOM,
        password: getters.GET_PASSWORD,
        time: Date.now(),
      },
    );

    await dispatch('ADD_EVENT_HANDLERS');
  },

  SET_AND_CONNECT_AND_JOIN_ROOM: ({ commit, dispatch }, { server, room, password }) => {
    commit('SET_SERVER', server);
    commit('SET_ROOM', room);
    commit('SET_PASSWORD', password);
    return dispatch('CONNECT_AND_JOIN_ROOM');
  },

  WAIT_FOR_SLPING: ({ getters }) => new Promise((resolve, reject) => {
    getters.GET_SOCKET.once('slPing', (secret) => {
      resolve(secret);
    });

    getters.GET_SOCKET.once('disconnect', (disconnectData) => {
      reject(disconnectData);
    });
  }),

  ESTABLISH_SOCKET_CONNECTION: async ({ commit, getters, dispatch }) => {
    // TODO: make wrapper method that disconnects the socket if it already exists
    if (getters.GET_SOCKET) {
      await dispatch('DISCONNECT');
    }

    const url = combineUrl('socket.io', getters.GET_SERVER);
    const socket = await socketConnect(url.origin, {
      path: url.pathname,
      transports: ['websocket', 'polling'],
    });

    commit('SET_SOCKET', socket);

    // Wait for initial slPing
    const secret = await dispatch('WAIT_FOR_SLPING');

    // Explicitly handling the slping because we haven't registered the events yet
    await dispatch('HANDLE_SLPING', secret);
  },

  JOIN_ROOM: async ({ getters, rootGetters, dispatch }) => {
    const clientPart = await dispatch('plexclients/POLL_CLIENT', null, { root: true });

    // Set this up before calling join so join-result handler is definitely there
    const joinPromise = new Promise((resolve, reject) => {
      // TODO: make the socket join args into one object instead (rewrite backend server)
      getters.GET_SOCKET.once('joinResult', ({ success, error, ...rest }) => {
        if (success) {
          resolve(rest);
        } else {
          reject(error);
        }
      });
    });

    getters.GET_SOCKET.emit(
      'join',
      {
        // TODO: rename to roomId
        roomId: getters.GET_ROOM,
        password: getters.GET_PASSWORD,
        desiredUsername: getters.GET_DISPLAY_USERNAME,
        // TODO: add config optin for this
        desiredPartyPausingEnabled: true,
        thumb: rootGetters['plex/GET_PLEX_USER'].thumb,
        playerProduct: rootGetters['plexclients/GET_CHOSEN_CLIENT'].product,
        ...clientPart,
      },
    );

    return joinPromise;
  },

  JOIN_ROOM_AND_INIT: async ({
    getters, rootGetters, dispatch, commit,
  }) => {
    const {
      user: { id, ...rest }, users, isPartyPausingEnabled, hostId,
    } = await dispatch('JOIN_ROOM');
    const updatedAt = Date.now();
    commit('SET_SOCKET_ID', id);
    commit('SET_HOST_ID', hostId);

    commit('SET_USERS', Object.fromEntries(
      Object.entries(users).map(([socketid, data]) => ([socketid, {
        ...data,
        updatedAt,
      }])),
    ));

    // Add ourselves to user list
    commit('SET_USER', {
      id,
      data: {
        ...rest,
        thumb: rootGetters['plex/GET_PLEX_USER'].thumb,
        media: rootGetters['plexclients/GET_ACTIVE_MEDIA_POLL_METADATA'],
        playerProduct: rootGetters['plexclients/GET_CHOSEN_CLIENT'].product,
        updatedAt,
        ...await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true }),
      },
    });

    commit('SET_PARTYPAUSING', isPartyPausingEnabled);
    commit('SET_IS_IN_ROOM', true);

    // await dispatch('START_CLIENT_POLLER');

    await dispatch('DISPLAY_NOTIFICATION', `Joined room: ${getters.GET_ROOM}`, { root: true });
  },

  DISCONNECT: ({ getters, commit }) => {
    console.log('Decided we should disconnect from the SL Server.');
    // TODO: await thing here

    // TODO: it is possible that the client could suddenly lose connection
    // right now when we are trying to actually disconnect. Fix
    const disconnectPromise = new Promise((resolve) => {
      getters.GET_SOCKET.once('disconnect', (data) => {
        resolve(data);
      });
    });

    // Cancel poller
    getters.GET_CLIENT_POLLER_CANCELER();
    commit('SET_CLIENT_POLLER_CANCELER', null);

    getters.GET_SOCKET.disconnect();
    commit('SET_IS_IN_ROOM', false);
    commit('SET_USERS', {});
    commit('SET_HOST_ID', null);
    commit('CLEAR_MESSAGES');
    commit('SET_MESSAGES_USER_CACHE', {});
    commit('SET_SOCKET', null);

    return disconnectPromise;
  },

  SEND_MESSAGE({ state, commit, rootGetters }, msg) {
    commit('ADD_MESSAGE', {
      msg,
      user: {
        username: 'You',
        thumb: rootGetters['plex/GET_PLEX_USER'].thumb,
      },
      type: 'message',
    });
    if (state.socket.connected) {
      state.socket.emit('send_message', {
        msg,
        type: 'message',
      });
    }
  },

  TRANSFER_HOST({ state }, username) {
    if (state.socket.connected) {
      state.socket.emit('transfer_host', {
        username,
      });
    }
  },

  updatePartyPausing({ state, commit }, value) {
    commit('SET_PARTYPAUSING', value);
    if (state.socket.connected) {
      state.socket.emit('party_pausing_change', value);
    }
  },

  sendPartyPause: ({ getters, dispatch }, isPause) => {
    if (getters.GET_SOCKET.connected && getters.getPartyPausing) {
      getters.GET_SOCKET.emit('party_pausing_send', isPause, async (response) => {
        console.log('Response from send', response);
        if (response) {
          if (isPause) {
            await dispatch('plexclients/PRESS_PAUSE', null, { root: true });
          } else {
            await dispatch('plexclients/PRESS_PLAY', null, { root: true });
          }
        }
      });
    }
  },

  FETCH_SERVERS_HEALTH: async ({ getters, commit }) => {
    const start = new Date().getTime();
    const results = await Promise.allSettled(getters.GET_SYNCLOUNGE_SERVERS
      .filter((server) => server.url !== 'custom')
      .map(async ({ url }) => ({
        ...(await axios.get(`${url}/health`, { timeout: 2000 }).data),
        latency: new Date().getTime() - start,
        url,
      })));

    const aliveServerHealths = results.filter((result) => result.status === 'fulfilled')
      .map(({ value }) => value);

    commit('SET_SERVERS_HEALTH', aliveServerHealths);
  },

  GET_OR_FETCH_SERVERS_HEALTH: async ({ dispatch, getters }) => {
    if (getters.GET_SERVERS_HEALTH) {
      return getters.GET_SERVERS_HEALTH;
    }

    await dispatch('FETCH_SERVERS_HEALTH');
    return getters.GET_SERVERS_HEALTH;
  },

  CREATE_AND_JOIN_ROOM: ({ getters, dispatch }) => dispatch('SET_AND_CONNECT_AND_JOIN_ROOM', {
    server: getters.GET_BEST_SERVER,
    room: guid(),
    password: null,
  }),

  START_CLIENT_POLLER: async ({ commit, dispatch, rootGetters }) => {
    commit('SET_CLIENT_POLLER_CANCELER', cancelablePeriodicTask(
      () => dispatch('POLL'),
      () => rootGetters['settings/GET_CLIENTPOLLINTERVAL'],
    ));
  },

  POLL: async ({ dispatch, getters }) => {
    const clientPart = await dispatch('plexclients/POLL_CLIENT', null, { root: true });
    const status = getters.GET_STATUS(clientPart.time);

    dispatch('EMIT_POLL', {
      ...clientPart,
      status,
      uuid: getters.GET_UUID,
    });
  },

  EMIT_POLL: ({ getters, dispatch, commit }, data) => {
    dispatch('EMIT', {
      name: 'poll',
      data: {
        ...data,
        commandId: getters.GET_POLL_NUMBER,
        // RTT / 2 because this is just the time it takes for a message to get to the server,
        // not a complete round trip. The receiver should add this latency as well as 1/2 their srtt
        // to the server when calculating delays
        latency: getters.GET_SRTT / 2,
      },
    });

    // TODO: make sure this doesn't lead to memory leaks if we have bad conns etc
    commit('ADD_UNACKED_POLL', {
      pollNumber: getters.GET_POLL_NUMBER,
      timeSent: Date.now(),
    });

    commit('INCREMENT_POLL_NUMBER');
  },

  EMIT: ({ getters }, { name, data }) => {
    getters.GET_SOCKET.emit(name, data);
  },

  ADD_RECENT_ROOM: ({ commit, getters }, newRoom) => commit(
    'SET_RECENT_ROOMS',
    Array.of(newRoom).concat(
      getters.GET_RECENT_ROOMS.filter(
        (room) => room.server !== newRoom.server || room.room !== newRoom.room,
      ),
    ),
  ),

  REMOVE_RECENT_ROOM: ({ commit, getters }, roomToRemove) => commit(
    'SET_RECENT_ROOMS',
    getters.GET_RECENT_ROOMS.filter(
      (room) => room.server !== roomToRemove.server || room.room !== roomToRemove.room,
    ),
  ),

  ADD_EVENT_HANDLERS: ({ getters, dispatch }) => {
    getters.GET_SOCKET.on('poll-result',
      (users, me, commandId) => dispatch('HANDLE_POLL_RESULT', { users, me, commandId }));

    getters.GET_SOCKET.on('party-pausing-changed',
      (res) => dispatch('HANDLE_PARTY_PAUSING_CHANGED', res));

    getters.GET_SOCKET.on('party-pausing-pause',
      (res) => dispatch('HANDLE_PARTY_PAUSING_PAUSE', res));

    getters.GET_SOCKET.on('userJoined',
      (data) => dispatch('HANDLE_USER_JOINED', data));

    getters.GET_SOCKET.on('userLeft',
      (data) => dispatch('HANDLE_USER_LEFT', data));

    getters.GET_SOCKET.on('newHost',
      (hostId) => dispatch('HANDLE_NEW_HOST', hostId));

    getters.GET_SOCKET.on('host-update',
      (hostData) => dispatch('HANDLE_HOST_UPDATE', hostData));

    getters.GET_SOCKET.on('disconnect',
      (disconnectData) => dispatch('HANDLE_DISCONNECT', disconnectData));

    getters.GET_SOCKET.on('newMesage', (msg) => dispatch('ADD_MESSAGE', msg));

    getters.GET_SOCKET.on('slPing', (secret) => dispatch('HANDLE_SLPING', secret));

    getters.GET_SOCKET.on('connect', () => dispatch('HANDLE_RECONNECT'));
  },

  HANDLE_PLAYER_STATE_UPDATE: async ({ dispatch }) => {
    // TODO: update the sidebar
    await dispatch('EMIT', {
      name: 'playerStateUpdate',
      data: await dispatch('slplayer/FETCH_TIMELINE_POLL_DATA', null, { root: true }),
    });
  },

  ADD_MESSAGE: ({ getters, commit }, msg) => {
    if (!getters.GET_MESSAGES_USER_CACHE_USER(msg.senderId)) {
      // Cache user details so we can still display user avatar and username after user leaves
      const { username, thumb } = getters.GET_USER(msg.senderId);

      commit('SET_MESSAGES_USER_CACHE_USER', {
        id: msg.senderId,
        data: {
          username, thumb,
        },
      });
    }

    commit('ADD_MESSAGE', {
      ...msg,
      time: Date.now(),
    });
  },

  ...eventhandlers,
};
