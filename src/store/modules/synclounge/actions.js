import axios from 'axios';
import io from 'socket.io-client';
import guid from '@/utils/guid';
import delay from '@/utils/delay';

function sendNotification(message) {
  console.log(message);
  return window.EventBus.$emit('notification', message);
}

function HandshakeUser(user, room, password, uuid, username) {
  const tempUser = {
    username: username || user.username || user.title,
    room,
    password,
    avatarUrl: user.thumb,
    uuid,
  };
  return tempUser;
}

export default {
  async autoJoin({ dispatch, rootGetters }, data) {
    await dispatch('socketConnect', {
      address: data.server,
    });
    const temporaryObj = {
      user: rootGetters.GET_PLEX_USER,
      roomName: data.room,
      password: data.password,
    };

    if (data.room) {
      await dispatch('joinRoom', temporaryObj);
    }
  },

  socketConnect({
    state, commit, rootGetters,
  }, data) {
    return new Promise((resolve, reject) => {
      const { address } = data;
      if (state.socket) {
        state.socket.disconnect();
      }
      const path = address.split('/')[3] || '';
      let addressCopy = ` ${address}`.slice(1).replace(path, '');
      if (addressCopy[address.length - 1] === '/') {
        addressCopy = address.slice(0, -1);
      }
      let ext = '';
      if (path) {
        ext = `/${path}`;
      }
      state.socket = io.connect(addressCopy, {
        forceNew: true,
        'connect timeout': 7000,
        path: `${ext}/socket.io`,
      });
      state.socket.on('connect', (result) => {
        // Good connection
        sendNotification(`Connected to ${address}`);
        commit('SET_CONNECTED', true);
        commit('SET_SERVER', address);
        if (state.room) {
          // Looks like the server disconnected on us, lets rejoin
          state.socket.emit(
            'join',
            new HandshakeUser(rootGetters.GET_PLEX_USER, state.room, state.password),
          );
        }
        return resolve(true, result);
      });
      state.socket.on('connect_error', (result) => {
        // Bad connection
        commit('SET_CONNECTED', false);
        commit('SET_SERVER', null);
        return reject(new Error(result));
      });
    });
  },

  async joinRoom({
    state, commit, dispatch, rootState, rootGetters,
  }, data) {
    dispatch('START_CLIENT_POLLER', null, { root: true });

    if (!state.socket || !state.connected) {
      throw new Error('Not connected to a server!');
    }

    if (typeof data.roomName !== 'string') {
      throw new Error('invalid room name');
    }

    console.log('Joining room', data.roomName);

    commit('SET_PASSWORD', data.password || '');
    let { username } = data.user;

    if (rootGetters['settings/GET_HIDEUSERNAME']) {
      username = rootGetters['settings/GET_ALTUSERNAME'];
    }

    state.socket.emit(
      'join',
      new HandshakeUser(data.user, data.roomName, data.password || '', rootState.uuid, username),
    );

    return new Promise((resolve) => {
      state.socket.on('join-result', async (result, _data, details, currentUsers, partyPausing) => {
        console.log('Got join result', result);
        commit('CLEAR_MESSAGES');
        if (result) {
          commit('SET_ROOM', _data.room);
          commit('SET_USERS', currentUsers);
          commit('SET_ME', _data.username);
          commit('SET_PARTYPAUSING', partyPausing);

          sendNotification(`Joined room: ${_data.room}`);
          // Add this item to our recently-connected list
          dispatch(
            'settings/ADD_RECENT_ROOM',
            {
              server: state.server,
              room: state.room,
              password: state.password,
              time: new Date().getTime(),
            },
            { root: true },
          );

          // Now we need to setup events for dealing with the PTServer.
          // We will regularly be recieving and sending data to and from the server.
          // We want to make sure we are listening for all the server events
          state.socket.on('poll-result', (users, me, commandId) => {
            commit('SET_VALUE', ['me', me]);
            commit('SET_USERS', users);
            if (state.commands[commandId]) {
              state.commands[commandId].end = new Date().getTime();
              state.commands[commandId].difference = Math.abs(
                state.commands[commandId].end - state.commands[commandId].start,
              );
            }
          });

          state.socket.on('party-pausing-changed', ({ value, user }) => {
            commit('ADD_MESSAGE', {
              msg: `Party Pausing has been turned ${value ? 'on' : 'off'}`,
              user,
              type: 'alert',
            });
            commit('SET_PARTYPAUSING', value);
          });

          state.socket.on('party-pausing-pause', ({ isPause, user }) => {
            const messageText = `${user.username} pressed ${isPause ? 'pause' : 'play'}`;
            commit('ADD_MESSAGE', {
              msg: messageText,
              user,
              type: 'alert',
            });
            sendNotification(messageText);
            if (rootGetters.GET_CHOSEN_CLIENT) {
              if (isPause) {
                rootGetters.GET_CHOSEN_CLIENT.pressPause();
              } else {
                rootGetters.GET_CHOSEN_CLIENT.pressPlay();
              }
            }
          });

          state.socket.on('user-joined', (users, user) => {
            commit('SET_USERS', users);
            commit('ADD_MESSAGE', {
              msg: `${user.username} joined`,
              user,
              type: 'alert',
            });
          });

          state.socket.on('user-left', (users, user) => {
            commit('SET_USERS', users);
            commit('ADD_MESSAGE', {
              msg: `${user.username} left the room`,
              user,
              type: 'alert',
            });
          });

          state.socket.on('host-swap', (user) => {
            if (!user) {
              return;
            }
            commit('ADD_MESSAGE', {
              msg: `${user.username} is now the host`,
              user,
              type: 'alert',
            });
          });

          state.socket.on('host-update', async (hostData) => {
            const hostUpdateData = hostData;
            hostUpdateData.recievedAt = new Date().getTime();
            const hostTimeline = hostUpdateData;
            if (
              !state.lastHostTimeline
              || state.lastHostTimeline.playerState !== hostUpdateData.playerState
            ) {
              window.EventBus.$emit('host-playerstate-change');
            }
            const diffBetweenLastUpdate = Math.abs(state.lastHostTimeline.time
              - hostUpdateData.time);
            if (diffBetweenLastUpdate > 5000) {
              window.EventBus.$emit('host-playerstate-change');
            }
            state.lastHostTimeline = hostUpdateData;
            const decisionMaker = async () => {
              const ourTimeline = rootGetters.GET_CHOSEN_CLIENT.lastTimelineObject;

              if (ourTimeline.playerState === 'buffering') {
                return;
              }
              if (
                (hostTimeline.playerState === 'stopped' || !hostTimeline.playerState)
                  && ourTimeline.state !== 'stopped'
              ) {
                sendNotification('The host pressed stop');
                await rootGetters.GET_CHOSEN_CLIENT.pressStop();
                return;
              }

              if (hostTimeline.playerState === 'stopped') {
                return;
              }
              // Check if we need to autoplay
              if (
                ((ourTimeline.state === 'stopped' || !ourTimeline.state)
                    && hostTimeline.playerState !== 'stopped')
                  || state.rawTitle !== hostTimeline.rawTitle
              ) {
                if (rootState.blockAutoPlay || !hostTimeline.rawTitle) {
                  return;
                }
                // We need to autoplay!
                if (!rootGetters['settings/GET_AUTOPLAY']) {
                  return;
                }
                commit('SET_BLOCK_AUTOPLAY', true, { root: true });

                const servers = { ...rootState.plex.servers };
                rootGetters['settings/GET_BLOCKEDSERVERS'].forEach((id) => {
                  if (rootState.plex.servers[id]) {
                    delete servers[id];
                  }
                });

                commit('SET_RAW_TITLE', hostTimeline.rawTitle);
                sendNotification(`Searching Plex Servers for "${hostTimeline.rawTitle}"`);

                const bestMatch = await dispatch('FIND_BEST_MEDIA_MATCH', hostTimeline, { root: true });
                if (bestMatch) {
                  await dispatch('PLEX_CLIENT_PLAY_MEDIA', {
                    // TODO: have timeline updates send out more info like mediaIdentifier etc
                    key: bestMatch.key,
                    mediaIndex: bestMatch.mediaIndex || 0,
                    serverIdentifier: bestMatch.machineIdentifier,
                    offset: hostTimeline.time || 0,
                  }).catch(() => {});
                } else {
                  sendNotification(
                    `Failed to find a compatible copy of ${hostTimeline.rawTitle}. If you have access to the content try manually playing it.`,
                  );
                }
                setTimeout(() => {
                  commit('SET_BLOCK_AUTOPLAY', false, { root: true });
                }, 15000);
                return;
              }

              if (hostTimeline.playerState === 'playing' && ourTimeline.state === 'paused') {
                sendNotification('Resuming..');
                resolve(await rootGetters.GET_CHOSEN_CLIENT.pressPlay());
                return;
              }
              if ((hostTimeline.playerState === 'paused'
                  || hostTimeline.playerState === 'buffering')
                  && ourTimeline.state === 'playing') {
                sendNotification('Pausing..');
                resolve(await rootGetters.GET_CHOSEN_CLIENT.pressPause());
                return;
              }
              if (hostTimeline.playerState === 'playing') {
                // Add on the delay between us and the SLServer plus the delay between the server and the host
                try {
                  const ourLastDelay = Math.round(
                    state.commands[Object.keys(state.commands).length - 1].difference,
                  );
                  const hostLastDelay = Math.round(hostTimeline.latency);
                  // console.log('adding delays', { ourLastDelay, hostLastDelay });
                  if (ourLastDelay && hostLastDelay) {
                    // console.log(
                    //   'Adding host delay',
                    //   hostLastDelay,
                    //   'and our lastDelay',
                    //   ourLastDelay,
                    // );
                    hostUpdateData.time = hostUpdateData.time + ourLastDelay
                      + hostLastDelay;
                  }
                } catch (e) {
                  console.log('Failed to add extra lag time');
                }
              }
              try {
                await rootGetters.GET_CHOSEN_CLIENT.sync(
                  hostUpdateData,
                  rootGetters['settings/GET_SYNCFLEXIBILITY'],
                  rootGetters['settings/GET_SYNCMODE'],
                  rootGetters['settings/GET_CLIENTPOLLINTERVAL'],
                );
              } catch (e) {
                resolve();
                return;
              }
              resolve();
            };
            /* This is data from the host, we should react to this data by potentially changing
              what we're playing or seeking to get back in sync with the host.

              We need to limit how ourself to make sure we dont hit the client too hard.
              We'll only fetch new data if our data is older than 1000ms.
              If we need to fetch new data, we'll do that and then decide
              if we need to seek or start playing something.
            */

            if (rootState.manualSyncQueued) {
              commit('SET_DECISION_BLOCKED_TIME', new Date().getTime());
              window.EventBus.$emit('host-playerstate-change');
              await rootGetters.GET_CHOSEN_CLIENT.seekTo(hostTimeline.time);
              commit('SET_MANUAL_SYNC_QUEUED', false, { root: true });
              commit('SET_DECISION_BLOCKED_TIME', 0);
              return;
            }
            if (Math.abs(state.decisionBlockedTime - new Date().getTime()) < 180000) {
              console.log(
                'Not going to make a decision from host data because a command is already running',
              );
              return;
            }

            if (!rootGetters.GET_CHOSEN_CLIENT.lastTimelineObject) {
              console.log('Dont have our first timeline data yet.');
              if (rootGetters.GET_CHOSEN_CLIENT.clientIdentifier === 'PTPLAYER9PLUS10') {
                // TODO: come back and fix this
                // eslint-disable-next-line no-param-reassign
                rootGetters.GET_CHOSEN_CLIENT.lastTimelineObject = {
                  playerState: 'stopped',
                };
              } else {
                return;
              }
            }
            // Check previous timeline data age
            commit('SET_DECISION_BLOCKED_TIME', new Date().getTime());

            // console.log('Timeline age is', timelineAge);
            try {
              // if ((timelineAge > 1000 && rootState.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10') || rootState.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
              //   await rootState.chosenClient.getTimeline()
              //   await decisionMaker(0)
              // } else {
              await decisionMaker();
              // }
            } catch (e) {
              console.log('Error caught in sync logic', e);
              commit('SET_DECISION_BLOCKED_TIME', 0);
            }
            commit('SET_DECISION_BLOCKED_TIME', 0);
          });

          state.socket.on('disconnect', (disconnectData) => {
            sendNotification('Disconnected from the SyncLounge server');
            console.log('Disconnect data', disconnectData);
            if (disconnectData === 'io client disconnect') {
              console.log('We disconnected from the server');
              commit('SET_ROOM', null);
              commit('SET_PASSWORD', null);
              commit('SET_USERS', []);
              commit('SET_CONNECTED', false);
              commit('SET_SERVER', null);
            } else if (disconnectData === 'transport close') {
              console.log('The server disconnected on us');
            }
          });

          state.socket.on('new_message', (msgObj) => {
            commit('ADD_MESSAGE', msgObj);
          });
        } else {
          commit('SET_ME', null);
          commit('SET_ROOM', null);
          commit('SET_PASSWORD', null);
          commit('SET_USERS', []);
        }

        return resolve(result);
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

};
