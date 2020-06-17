import axios from 'axios';
import socketConnect from '@/utils/socketconnect';
import guid from '@/utils/guid';
import delay from '@/utils/delay';
import eventhandlers from '@/store/modules/synclounge/eventhandlers';
import combineUrl from '@/utils/combineurl';

export default {
  async autoJoin({ dispatch }, data) {
    await dispatch('ESTABLISH_SOCKET_CONNECTION', data.server);

    if (data.room) {
      await dispatch('JOIN_ROOM', {
        room: data.room,
        password: data.password,
      });
    }
  },

  ESTABLISH_SOCKET_CONNECTION: async ({ commit, getters }, address) => {
    // TODO: make wrapper method that disconnects the socket if it already exists
    if (getters.GET_SOCKET) {
      getters.GET_SOCKET.disconnect();
    }

    const url = combineUrl('socket.io', address);
    const socket = await socketConnect(url.origin, { path: url.pathname });
    commit('SET_SOCKET', socket);
  },

  async JOIN_ROOM({
    getters, commit, dispatch, rootGetters,
  }, { room, password }) {
    // Move this outside somewhere else
    // dispatch('START_CLIENT_POLLER', null, { root: true });

    // TODO: remove this
    commit('SET_PASSWORD', password);

    getters.GET_SOCKET.emit(
      'join',
      {
        username: getters.GET_DISPLAY_USERNAME,
        room,
        password,
        avatarUrl: rootGetters['plex/GET_PLEX_USER'].thumb,
        uuid: getters.GET_UUID,
      },
    );

    return new Promise((resolve, reject) => {
      // TODO: make the socket join args into one object instead (rewrite backend server)
      getters.GET_SOCKET.once('join-result', async (result, _data, details, currentUsers, partyPausing) => {
        if (result) {
          dispatch('HANDLE_SUCCESSFUL_JOIN_RESULT', {
            result, _data, currentUsers, partyPausing,
          });
          resolve();
        } else {
          commit('SET_ME', null);
          commit('SET_ROOM', null);
          commit('SET_PASSWORD', null);
          commit('SET_USERS', []);
          reject();
        }
      });
    });
  },

  disconnectServer({ state, commit }) {
    console.log('Decided we should disconnect from the SL Server.');
    state.socket.disconnect();
    commit('SET_ROOM', null);
    commit('SET_PASSWORD', null);
    commit('SET_USERS', []);
    commit('SET_CONNECTED', false);
    commit('SET_SERVER', null);
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

  transferHost({ state }, username) {
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

  sendPartyPause({ state, rootGetters }, isPause) {
    if (state.socket.connected) {
      state.socket.emit('party_pausing_send', isPause, (response) => {
        console.log('Response from send', response);
        if (response) {
          if (isPause) {
            rootGetters.GET_CHOSEN_CLIENT.pressPause();
          } else {
            rootGetters.GET_CHOSEN_CLIENT.pressPlay();
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

  CREATE_AND_JOIN_ROOM: ({ getters, dispatch }) => {
    const url = getters.GET_BEST_SERVER;
    return dispatch('autoJoin', {
      server: url,
      room: guid(),
    });
  },

  JOIN_CONFIG_SYNCLOUNGE_SERVER: ({ rootGetters, dispatch }) => dispatch('autoJoin', {
    server: rootGetters.GET_CONFIG.autoJoinServer,
    room: rootGetters.GET_CONFIG.autoJoinRoom,
    password: rootGetters.GET_CONFIG.autoJoinPassword,
  }),

  START_CLIENT_POLLER: async ({ getters, dispatch }) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!getters.GET_ROOM) {
        // stop polling if we leave the room
        break;
      }

      const delayPromise = delay(getters['settings/GET_CLIENTPOLLINTERVAL']);

      // eslint-disable-next-line no-await-in-loop
      await dispatch('POLL');
      // eslint-disable-next-line no-await-in-loop
      await delayPromise;
    }
  },

  POLL: async ({ dispatch, getters }) => {
    const clientPart = await dispatch('plexclients/POLL_CLIENT');
    const status = getters.COMPUTE_STATUS(clientPart.time);

    dispatch('EMIT_POLL', {
      ...clientPart,
      status,
      uuid: getters.GET_UUID,
    });
  },

  EMIT_POLL: ({ getters, dispatch, commit }, data) => {
    dispatch('EMIT', {
      tynamepe: 'poll',
      data: {
        ...data,
        commandId: getters.GET_POLL_NUMBER,
        latency: getters.GET_SRTT,
      },
    });

    commit('ADD_UNACKED_POLL', {
      pollNumber: getters.GET_POLL_NUMBER,
      timeSent: Date.now(),
    });

    commit('INCREMENT_POLL_NUMBER');
  },

  EMIT: ({ getters }, { name, data }) => {
    getters.GET_SOCKET.emit(name, data);
  },

  ...eventhandlers,
};
