import axios from 'axios';
import socketConnect from '@/utils/socketconnect';
import guid from '@/utils/guid';
import delay from '@/utils/delay';
import eventhandlers from '@/store/modules/synclounge/eventhandlers';

export default {
  async autoJoin({ dispatch, rootGetters }, data) {
    await dispatch('ESTABLISH_SOCKET_CONNECTION', data.server);
    console.log('ESTABISHED');
    const temporaryObj = {
      user: rootGetters.GET_PLEX_USER,
      roomName: data.room,
      password: data.password,
    };

    if (data.room) {
      await dispatch('joinRoom', temporaryObj);
    }
  },

  ESTABLISH_SOCKET_CONNECTION: async ({ commit }, address) => {
    // TODO: make wrapper method that disconnects the socket if it already exists
    const base = new URL(`${address}////`);
    console.log(base);
    const url = new URL('socket.io', base.href);
    console.log(url);
    const socket = await socketConnect(url.origin, { path: url.pathname });
    commit('SET_SOCKET', socket);
  },

  async JOIN_ROOM({
    getters, commit, dispatch, rootGetters,
  }, { room, password }) {
    // Move this outside somewhere else
    dispatch('START_CLIENT_POLLER', null, { root: true });

    // TODO: remove this
    commit('SET_PASSWORD', password);

    getters.GET_SOCKET.emit(
      'join',
      {
        username: getters.GET_DISPLAY_USERNAME,
        room,
        password,
        avatarUrl: rootGetters['plex/GET_USER'].thumb,
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

  sendNewMessage({ state, commit, rootGetters }, msg) {
    commit('ADD_MESSAGE', {
      msg,
      user: {
        username: 'You',
        thumb: rootGetters.GET_PLEX_USER.thumb,
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

  START_CLIENT_POLLER: async ({ getters }) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const delayPromise = delay(getters['settings/GET_CLIENTPOLLINTERVAL']);

      // eslint-disable-next-line no-await-in-loop
      await getters.GET_CHOSEN_CLIENT.getTimeline().catch(() => { });
      // eslint-disable-next-line no-await-in-loop
      await delayPromise;
    }
  },

  ...eventhandlers,
};
