import axios from 'axios';
import moment from 'moment';
import io from 'socket.io-client';

const EventEmitter = require('events');

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

const initialState = () => ({
  socket: null,
  ptevents: new EventEmitter(),
  ptservers: [],
  connected: false,
  server: false,
  room: false,
  password: false,
  users: [],
  messages: [],
  partyPausing: false,
  me: '',
  decisionBlocked: 0,
  lastHostTimeline: {},
  commands: {},
});

const getters = {
  getServer: state => state.server,
  getMe: state => state.me,
  getRoom: state => state.room,
  getPassword: state => state.password,
  getUsers: state => state.users,
  getConnected: state => state.connected,
  getMessages: state => state.messages,
  getSocket: state => state.socket,
  getPartyPausing: state => () => state.partyPausing,
};

const mutations = {
  SET_CONNECTED(state, value) {
    state.connected = value;
  },
  SET_ME(state, value) {
    state.me = value;
  },
  SET_USERS(state, value) {
    state.users = value;
  },
  SET_ROOM(state, value) {
    state.room = value;
  },
  SET_PASSWORD(state, value) {
    state.password = value;
  },
  SET_SERVERS(state, value) {
    state.servers = value;
  },
  SET_SERVER(state, value) {
    state.server = value;
  },
  SET_PARTYPAUSING(state, value) {
    state.partyPausing = value;
  },
  ADD_MESSAGE(state, msg) {
    msg.time = moment().format('h:mm A');
    state.messages.push(msg);
  },
  CLEAR_MESSAGES(state) {
    state.messages = [];
  },
};

const actions = {
  async autoJoin({ rootState, dispatch }, data) {
    await dispatch('socketConnect', {
      address: data.server,
    });
    const temporaryObj = {
      user: rootState.plex.user,
      roomName: data.room,
      password: data.password,
    };
    if (data.room) {
      await dispatch('joinRoom', temporaryObj);
    }
  },

  socketConnect({ state, commit, rootState }, data) {
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
      state.socket = io.connect(
        addressCopy,
        {
          forceNew: true,
          'connect timeout': 7000,
          path: `${ext}/socket.io`,
        },
      );
      state.socket.on('connect', (result) => {
        // Good connection
        sendNotification(`Connected to ${address}`);
        commit('SET_CONNECTED', true);
        commit('SET_SERVER', address);
        if (state.room) {
          // Looks like the server disconnected on us, lets rejoin
          state.socket.emit(
            'join',
            new HandshakeUser(rootState.plex.user, state.room, state.password),
          );
        }
        console.log("OIKAYYYYY THIS SHOULD RESOLVE NOW")
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

  joinRoom({
    state, commit, dispatch, rootState, rootGetters,
  }, data) {
    return new Promise(async (resolve) => {
      if (!state.socket || !state.connected) {
        throw new Error('Not connected to a server!');
      }
      if (typeof data.roomName !== 'string') {
        throw new Error('invalid room name');
      }
      console.log('Joining room', data.roomName);
      data.password = data.password || '';
      commit('SET_PASSWORD', data.password);
      let username = data.user.username;

      if (rootGetters['settings/GET_HIDEUSERNAME']) {
        username = rootGetters['settings/GET_ALTUSERNAME'];
      }

      state.socket.emit(
        'join',
        new HandshakeUser(data.user, data.roomName, data.password, rootState.uuid, username),
      );
      state.socket.on(
        'join-result',
        async (result, _data, details, currentUsers, partyPausing) => {
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

            // Generate our short url/invite link
            let urlOrigin =
              window.location.origin + (rootGetters['config/GET_CONFIG'].webroot || '');
            if (process.env.NODE_ENV === 'development') {
              urlOrigin = 'http://app.synclounge.tv';
            }

            const data = {
              urlOrigin,
              owner: rootState.plex.user.username || rootState.plex.user.title,
              server: state.server,
              room: state.room,
              password: state.password || '',
            };
            // if (settings.webroot) urlOrigin = urlOrigin + settings.webroot
            axios.post(`${urlOrigin}/invite`, data).then((res) => {
              commit('SET_SHORTLINK', res.data.url);
            });

            // Now we need to setup events for dealing with the PTServer.
            // We will regularly be recieving and sending data to and from the server.
            // We want to make sure we are listening for all the server events
            state.socket.on('poll-result', (users, me, commandId) => {
              commit('SET_VALUE', ['me', me]);
              commit('SET_USERS', users);
              if (state.commands[commandId]) {
                state.commands[commandId].end = new Date().getTime();
                state.commands[commandId].difference = Math.abs(state.commands[commandId].end - state.commands[commandId].start);
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
              if (rootState.chosenClient) {
                if (isPause) {
                  rootState.chosenClient.pressPause();
                } else {
                  rootState.chosenClient.pressPlay();
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

            state.socket.on('host-update', async (data) => {
              data.recievedAt = new Date().getTime();
              const hostTimeline = data;
              if (
                !state.lastHostTimeline ||
                state.lastHostTimeline.playerState !== data.playerState
              ) {
                window.EventBus.$emit('host-playerstate-change');
              }
              const diffBetweenLastUpdate = Math.abs(state.lastHostTimeline.time - data.time);
              if (diffBetweenLastUpdate > 5000) {
                window.EventBus.$emit('host-playerstate-change');
              }
              state.lastHostTimeline = data;
              const decisionMaker = (timelineAge) => {
                const ourTimeline = rootState.chosenClient.lastTimelineObject;
                return new Promise(async (resolve, reject) => {
                  if (ourTimeline.playerState === 'buffering') {
                    return resolve();
                  }
                  if (
                    (hostTimeline.playerState === 'stopped' || !hostTimeline.playerState) &&
                    ourTimeline.state !== 'stopped'
                  ) {
                    sendNotification('The host pressed stop');
                    await rootState.chosenClient.pressStop();
                    return resolve();
                  }

                  if (hostTimeline.playerState === 'stopped') {
                    return resolve();
                  }
                  // Check if we need to autoplay
                  if (
                    ((ourTimeline.state === 'stopped' || !ourTimeline.state) &&
                      hostTimeline.playerState !== 'stopped') ||
                    rootState.rawTitle !== hostTimeline.rawTitle
                  ) {
                    if (rootState.blockAutoPlay || !hostTimeline.rawTitle) {
                      return resolve();
                    }
                    // We need to autoplay!
                    if (!rootGetters['settings/GET_AUTOPLAY']) {
                      return resolve();
                    }
                    rootState.blockAutoPlay = true;

                    const servers = Object.assign({}, rootState.plex.servers);
                    rootGetters['settings/GET_BLOCKEDSERVERS'].forEach((id) => {
                      if (rootState.plex.servers[id]) {
                        delete servers[id];
                      }
                    });

                    rootState.rawTitle = hostTimeline.rawTitle;
                    sendNotification(`Searching Plex Servers for "${hostTimeline.rawTitle}"`);
                    const result = await rootState.chosenClient
                      .playContentAutomatically(
                        rootState.chosenClient,
                        hostTimeline,
                        servers,
                        hostTimeline.time,
                      )
                      .catch(async (e) => {
                        const hostServer = rootState.plex.servers[hostTimeline.machineIdentifier];
                        if (hostServer && hostTimeline.key) {
                          if (
                            !rootGetters['settings/GET_BLOCKEDSERVERS'].includes(hostTimeline.machineIdentifier)
                          ) {
                            try {
                              await rootState.chosenClient.playMedia({
                                ratingKey: hostTimeline.key,
                                mediaIndex: null,
                                server: rootState.plex.servers[hostTimeline.machineIdentifier],
                                offset: hostTimeline.time || 0,
                              });
                              setTimeout(() => {
                                rootState.blockAutoPlay = false;
                              }, 15000);
                              return resolve();
                            } catch (e) {}
                          }
                        }
                        sendNotification(`Failed to find a compatible copy of ${
                          hostTimeline.rawTitle
                        }. If you have access to the content try manually playing it.`);
                        setTimeout(() => {
                          rootState.blockAutoPlay = false;
                        }, 15000);
                      });
                    await new Promise((resolve, reject) => {
                      setTimeout(() => resolve(), 1000);
                    });
                    setTimeout(() => {
                      rootState.blockAutoPlay = false;
                    }, 10000);
                    return resolve();
                  }

                  if (hostTimeline.playerState === 'playing' && ourTimeline.state === 'paused') {
                    sendNotification('Resuming..');
                    return resolve(await rootState.chosenClient.pressPlay());
                  }
                  if (hostTimeline.playerState === 'paused' && ourTimeline.state === 'playing') {
                    sendNotification('Pausing..');
                    return resolve(await rootState.chosenClient.pressPause());
                  }
                  if (hostTimeline.playerState === 'playing') {
                    // Add on the delay between us and the SLServer plus the delay between the server and the host
                    try {
                      const ourLastDelay = Math.round(state.commands[Object.keys(state.commands).length - 1].difference);
                      const hostLastDelay = Math.round(hostTimeline.latency);
                      console.log('adding delays', { ourLastDelay, hostLastDelay });
                      if (ourLastDelay && hostLastDelay) {
                        console.log(
                          'Adding host delay',
                          hostLastDelay,
                          'and our lastDelay',
                          ourLastDelay,
                        );
                        data.time = data.time + (ourLastDelay || 0) + (hostLastDelay || 0);
                      }
                    } catch (e) {
                      console.log('Failed to add extra lag time');
                    }
                  }
                  try {
                    await rootState.chosenClient.sync(
                      data,
                      rootGetters['settings/GET_SYNCFLEXIBILITY'],
                      rootGetters['settings/GET_SYNCMODE'],
                      rootGetters['settings/GET_CLIENTPOLLINTERVAL'],
                    );
                  } catch (e) {
                    return resolve();
                  }
                  return resolve();
                });
              };
              /* This is data from the host, we should react to this data by potentially changing
              what we're playing or seeking to get back in sync with the host.

              We need to limit how ourself to make sure we dont hit the client too hard.
              We'll only fetch new data if our data is older than 1000ms.
              If we need to fetch new data, we'll do that and then decide
              if we need to seek or start playing something.
            */
              rootState.hostClientResponseTime = data.clientResponseTime;
              if (rootState.manualSyncQueued) {
                state.decisionBlocked = new Date().getTime();
                window.EventBus.$emit('host-playerstate-change');
                await rootState.chosenClient.seekTo(hostTimeline.time);
                rootState.manualSyncQueued = false;
                state.decisionBlocked = 0;
                return;
              }
              if (Math.abs(state.decisionBlocked - new Date().getTime()) < 180000) {
                console.log('We are not going to make a decision from the host data because a command is already running');
                return;
              }
              console.log('Decision isnt blocked');
              if (!rootState.chosenClient) {
                console.log('We dont have a client chosen yet!');
                return;
              }
              if (!rootState.chosenClient.lastTimelineObject) {
                console.log('Dont have our first timeline data yet.');
                if (rootState.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
                  rootState.chosenClient.lastTimelineObject = {
                    playerState: 'stopped',
                  };
                } else {
                  return;
                }
              }
              // Check previous timeline data age
              state.decisionBlocked = new Date().getTime();
              const timelineAge = Math.abs(new Date().getTime() - rootState.chosenClient.lastTimelineObject.recievedAt);
              console.log('Timeline age is', timelineAge);
              try {
                // if ((timelineAge > 1000 && rootState.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10') || rootState.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
                //   await rootState.chosenClient.getTimeline()
                //   await decisionMaker(0)
                // } else {
                await decisionMaker(timelineAge);
                // }
              } catch (e) {
                console.log('Error caught in sync logic', e);
                state.decisionBlocked = 0;
              }
              state.decisionBlocked = 0;
            });

            state.socket.on('disconnect', (data) => {
              sendNotification('Disconnected from the SyncLounge server');
              console.log('Disconnect data', data);
              if (data === 'io client disconnect') {
                console.log('We disconnected from the server');
                commit('SET_ROOM', null);
                commit('SET_PASSWORD', null);
                commit('SET_USERS', []);
                commit('SET_CONNECTED', false);
                commit('SET_SERVER', null);
                state.serverError = null;
              }
              if (data === 'transport close') {
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
        },
      );
    });
  },

  disconnectServer({ state, commit }) {
    return new Promise((resolve, reject) => {
      console.log('Decided we should disconnect from the SL Server.');
      state.socket.disconnect();
      commit('SET_ROOM', null);
      commit('SET_PASSWORD', null);
      commit('SET_USERS', []);
      commit('SET_CONNECTED', false);
      commit('SET_SERVER', null);
      resolve();
    });
  },
  
  sendNewMessage({ state, commit, rootState }, msg) {
    commit('ADD_MESSAGE', {
      msg,
      user: {
        username: 'You',
        thumb: rootState.plex.user.thumb,
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

  sendPartyPause({ rootState, state }, isPause) {
    if (state.socket.connected) {
      state.socket.emit('party_pausing_send', isPause, (response) => {
        console.log('Response from send', response);
        if (response) {
          if (isPause) {
            rootState.chosenClient.pressPause();
          } else {
            rootState.chosenClient.pressPlay();
          }
        }
      });
    }
  },
};

export default {
  state: initialState,
  getters,
  mutations,
  actions,
};
