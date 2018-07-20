const EventEmitter = require('events')
var moment = require('moment')
var axios = require('axios')

let SettingsHelper = require('../../../SettingsHelper.js')
let settings = new SettingsHelper()

function sendNotification (message) {
  return window.EventBus.$emit('notification', message)
}

function HandshakeUser (user, room, password, uuid, username) {
  var tempUser = {
    username: username || user.username || user.title,
    room: room,
    password: password,
    avatarUrl: user.thumb,
    uuid: uuid
  }
  return tempUser
}
export default {
  state: {
    _io: require('socket.io-client'),
    _socket: null,
    ptevents: new EventEmitter(),
    ptservers: [],
    connected: false,
    server: false,
    room: false,
    password: false,
    users: [],
    messages: [],
    me: '',
    decisionBlocked: 0,
    lastHostTimeline: {},
    commands: {}
  },
  getters: {
    getServer: state => {
      return state.server
    },
    getMe: state => {
      return state.me
    },
    getRoom: state => {
      return state.room
    },
    getPassword: state => {
      return state.password
    },
    getUsers: state => {
      return state.users
    },
    getConnected: state => {
      return state.connected
    },
    getMessages: state => {
      return state.messages
    },
    getSocket: state => {
      return state._socket
    }
  },
  mutations: {
    SET_CONNECTED (state, value) {
      state.connected = value
    },
    SET_ME (state, value) {
      state.me = value
    },
    SET_USERS (state, value) {
      state.users = value
    },
    SET_ROOM (state, value) {
      state.room = value
    },
    SET_PASSWORD (state, value) {
      state.password = value
    },
    SET_SERVERS (state, value) {
      state.servers = value
    },
    SET_SERVER (state, value) {
      state.server = value
    },
    ADD_MESSAGE (state, msg) {
      msg.time = moment().format('h:mm A')
      state.messages.push(msg)
    },
    CLEAR_MESSAGES (state, msg) {
      state.messages = []
    }
  },

  actions: {
    async autoJoin ({ state, commit, rootState, dispatch }, data) {
      console.log('Attempting to auto join..', data)
      await dispatch('socketConnect', {
        address: data.server
      })
      console.log('Done connection to server in autojoin flow')
      let temporaryObj = {
        user: rootState.plex.user,
        roomName: data.room,
        password: data.password
      }
      if (data.room) {
        await dispatch('joinRoom', temporaryObj)
        console.log('Done joining room in autojoin flow')
      }
    },
    socketConnect ({ state, commit, rootState }, data) {
      return new Promise((resolve, reject) => {
        let address = data.address
        if (state._socket) {
          state._socket.disconnect()
        }
        console.log('Socket attempt connect on ' + address)
        let path = address.split('/')[3] || ''
        address = address.replace(path, '')
        console.log('Pathname', path)
        state._socket = state._io.connect(address, {
          'forceNew': true,
          'connect timeout': 7000,
          path: '/' + path + '/socket.io'
        })
        state._socket.on('connect', function (result) {
          // Good connection
          sendNotification('Connected to ' + address)
          commit('SET_CONNECTED', true)
          commit('SET_SERVER', address)
          if (state.room) {
            // Looks like the server disconnected on us, lets rejoin
            console.log('Attempting to rejoin our room...')
            state._socket.emit('join', new HandshakeUser(rootState.plex.user, state.room, state.password))
          }
          return resolve(true, result)
        })
        state._socket.on('connect_error', (result) => {
          // Bad connection
          console.log('Failed to connect', result)
          commit('SET_CONNECTED', false)
          commit('SET_SERVER', null)
          return reject(new Error(result))
        })
      })
    },
    joinRoom ({ state, commit, rootState }, data) {
      return new Promise(async (resolve, reject) => {
        if (!state._socket || !state.connected) {
          console.log('Tried to join a room but we are not connected to a SL server')
          return reject(new Error('Not connected to a server!'))
        }
        data.password = data.password || ''
        commit('SET_PASSWORD', data.password)
        let username = data.user.username
        console.log('RootState', rootState, JSON.parse(rootState.settings.HIDEUSERNAME))
        if (JSON.parse(rootState.settings.HIDEUSERNAME)) {
          username = rootState.settings.ALTUSERNAME
        }
        state._socket.emit('join', new HandshakeUser(data.user, data.roomName, data.password, rootState.uuid, username))
        state._socket.on('join-result', async (result, _data, details, currentUsers) => {
          commit('CLEAR_MESSAGES')
          console.log('Join room result', result, _data, details, currentUsers)
          if (result) {
            commit('SET_ROOM', _data.room)
            commit('SET_USERS', currentUsers)
            commit('SET_ME', _data.username)

            sendNotification('Joined room: ' + _data.room)
            // Add this item to our recently-connected list
            let recents = window.localStorage.getItem('recentrooms')
            if (!recents) {
              recents = {}
            } else {
              recents = JSON.parse(recents)
            }
            recents[state.server + '/' + state.room] = {
              server: state.server,
              room: state.room,
              password: state.password,
              time: new Date().getTime()
            }
            window.localStorage.setItem('recentrooms', JSON.stringify(recents))

            // Generate our short url/invite link
            console.log('generating our invite link')
            console.log(state)
            console.log('Loaded settings', settings)
            let urlOrigin = window.location.origin + (settings.webroot || '')
            if (process.env.NODE_ENV === 'development') {
              urlOrigin = 'http://app.synclounge.tv'
            }

            let data = {
              urlOrigin: urlOrigin,
              owner: rootState.plex.user.username || rootState.plex.user.title,
              server: state.server,
              room: state.room,
              password: state.password || ''
            }
            axios.post(urlOrigin + '/invite', data).then((res) => {
              console.log('INVITE DATA RESULT', res)
              commit('SET_SHORTLINK', res.data.url)
            })

            // Now we need to setup events for dealing with the PTServer.
            // We will regularly be recieving and sending data to and from the server.
            // We want to make sure we are listening for all the server events
            state._socket.on('poll-result', (users, me, commandId) => {
              commit('SET_VALUE', ['me', me])
              commit('SET_USERS', users)
              if (state.commands[commandId]) {
                state.commands[commandId].end = new Date().getTime()
                state.commands[commandId].difference = Math.abs(state.commands[commandId].end - state.commands[commandId].start)
              }
            })
            state._socket.on('user-joined', (users, user, commandId) => {
              commit('SET_USERS', users)
              commit('ADD_MESSAGE', {
                msg: user.username + ' joined',
                user: user,
                type: 'alert'
              })
              console.log(users)
            })
            state._socket.on('user-left', (users, user) => {
              commit('SET_USERS', users)
              commit('ADD_MESSAGE', {
                msg: user.username + ' left the room',
                user: user,
                type: 'alert'
              })
            })
            state._socket.on('host-swap', (user) => {
              if (!user) {
                return
              }
              commit('ADD_MESSAGE', {
                msg: user.username + ' is now the host',
                user: user,
                type: 'alert'
              })
            })
            state._socket.on('host-update', async (data) => {
              data.recievedAt = new Date().getTime()
              const hostTimeline = data
              if (!state.lastHostTimeline || state.lastHostTimeline.playerState !== data.playerState) {
                window.EventBus.$emit('host-playerstate-change')
              }
              let diffBetweenLastUpdate = Math.abs(state.lastHostTimeline.time - data.time)
              if (diffBetweenLastUpdate > 5000) {
                window.EventBus.$emit('host-playerstate-change')
              }
              state.lastHostTimeline = data
              const decisionMaker = (timelineAge) => {
                let ourTimeline = rootState.chosenClient.lastTimelineObject
                return new Promise(async (resolve, reject) => {
                  if (ourTimeline.playerState === 'buffering') {
                    return resolve()
                  }
                  if ((hostTimeline.playerState === 'stopped' || !hostTimeline.playerState) && ourTimeline.state !== 'stopped') {
                    console.log('Pressing stop because the host did')
                    sendNotification('The host pressed stop')
                    await rootState.chosenClient.pressStop()
                    return resolve()
                  }

                  if (hostTimeline.playerState === 'stopped') {
                    return resolve()
                  }
                  // Check if we need to autoplay
                  if ((ourTimeline.state === 'stopped' || !ourTimeline.state) && (hostTimeline.playerState !== 'stopped')) {
                    if (rootState.blockAutoPlay || !hostTimeline.rawTitle) {
                      return resolve()
                    }
                    // We need to autoplay!
                    if (!rootState.settings.AUTOPLAY) {
                      console.log('AUTOPLAY is disabled', rootState.settings.AUTOPLAY)
                      return resolve()
                    }
                    rootState.blockAutoPlay = true

                    let blockedServers = rootState.settings.BLOCKEDSERVERS
                    let servers = Object.assign({}, rootState.plex.servers)
                    if (blockedServers) {
                      for (let i = 0; i < blockedServers.length; i++) {
                        if (rootState.plex.servers[blockedServers[i]]) {
                          delete servers[i]
                        }
                      }
                    }

                    sendNotification('Searching Plex Servers for "' + hostTimeline.rawTitle + '"')
                    let result = await rootState.chosenClient.playContentAutomatically(rootState.chosenClient, hostTimeline, servers, hostTimeline.time).catch(async (e) => {
                      console.log('Host timeline', hostTimeline)
                      let hostServer = rootState.plex.servers[hostTimeline.machineIdentifier]
                      if (hostServer && hostTimeline.key) {
                        let isBlocked = false
                        let blockedServers = JSON.parse(rootState.settings.BLOCKEDSERVERS)
                        console.log('Blocked servers', rootState.settings.BLOCKEDSERVERS)
                        if (blockedServers && blockedServers.length > 0) {
                          blockedServers.map((server) => {
                            if (server === hostTimeline.machineIdentifier) {
                              isBlocked = true
                            }
                          })
                        }
                        if (!isBlocked) {
                          console.log('Attempting to play directly from the server the host is using as we have access')
                          try {
                            await rootState.chosenClient.playMedia({
                              ratingKey: hostTimeline.key,
                              mediaIndex: null,
                              server: rootState.plex.servers[hostTimeline.machineIdentifier],
                              offset: hostTimeline.time || 0
                            })
                            setTimeout(() => {
                              rootState.blockAutoPlay = false
                            }, 15000)
                            return resolve()
                          } catch (e) {
                            console.log('Error playing directly from the same server as the host', e)
                          }
                        }
                      }
                      sendNotification('Failed to find a compatible copy of ' + hostTimeline.rawTitle + '. If you have access to the content try manually playing it.')
                      setTimeout(() => {
                        rootState.blockAutoPlay = false
                      }, 15000)
                    })
                    console.log('Auto play result: ' + result)
                    await new Promise((resolve, reject) => {
                      setTimeout(() => resolve(), 1000)
                    })
                    setTimeout(() => {
                      rootState.blockAutoPlay = false
                    }, 10000)
                    return resolve()
                  }

                  if (hostTimeline.playerState === 'playing' && ourTimeline.state === 'paused') {
                    sendNotification('Resuming..')
                    return resolve(await rootState.chosenClient.pressPlay())
                  }
                  if (hostTimeline.playerState === 'paused' && ourTimeline.state === 'playing') {
                    sendNotification('Pausing..')
                    return resolve(await rootState.chosenClient.pressPause())
                  }
                  if (hostTimeline.playerState === 'playing') {
                    // Add on the delay between us and the SLServer plus the delay between the server and the host
                    try {
                      let ourLastDelay = Math.round(state.commands[Object.keys(state.commands).length - 1].difference * 0.50)
                      let hostLastDelay = Math.round(hostTimeline.latency * 0.50)
                      if (ourLastDelay && hostLastDelay) {
                        console.log('Adding host delay', hostLastDelay, 'and our lastDelay', ourLastDelay)
                        data.time = data.time + (ourLastDelay || 0) + (hostLastDelay || 0)
                      }
                    } catch (e) {
                      console.log('Failed to add extra lag time')
                    }
                  }
                  try {
                    await rootState.chosenClient.sync(data, rootState.settings.SYNCFLEXABILITY, rootState.settings.SYNCMODE, rootState.settings.CLIENTPOLLINTERVAL)
                  } catch (e) {
                    return resolve()
                  }
                  return resolve()
                })
              }
              /* This is data from the host, we should react to this data by potentially changing
                what we're playing or seeking to get back in sync with the host.

                We need to limit how ourself to make sure we dont hit the client too hard.
                We'll only fetch new data if our data is older than 1000ms.
                If we need to fetch new data, we'll do that and then decide
                if we need to seek or start playing something.
              */
              rootState.hostClientResponseTime = data.clientResponseTime
              if (rootState.manualSyncQueued) {
                state.decisionBlocked = new Date().getTime()
                window.EventBus.$emit('host-playerstate-change')
                await rootState.chosenClient.seekTo(hostTimeline.time)
                rootState.manualSyncQueued = false
                state.decisionBlocked = 0
                return
              }
              if (Math.abs(state.decisionBlocked - new Date().getTime()) < 180000) {
                console.log('We are not going to make a decision from the host data because a command is already running')
                return
              }
              console.log('Decision isnt blocked')
              if (!rootState.chosenClient) {
                console.log('We dont have a client chosen yet!')
                return
              }
              if (!rootState.chosenClient.lastTimelineObject) {
                console.log('Dont have our first timeline data yet.')
                if (rootState.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
                  rootState.chosenClient.lastTimelineObject = {
                    playerState: 'stopped'
                  }
                } else {
                  return
                }
              }
              // Check previous timeline data age
              state.decisionBlocked = new Date().getTime()
              let timelineAge = Math.abs(new Date().getTime() - rootState.chosenClient.lastTimelineObject.recievedAt)
              console.log('Timeline age is', timelineAge)
              try {
                // if ((timelineAge > 1000 && rootState.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10') || rootState.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
                //   await rootState.chosenClient.getTimeline()
                //   await decisionMaker(0)
                // } else {
                await decisionMaker(timelineAge)
                // }
              } catch (e) {
                console.log('Error caught in sync logic', e)
                state.decisionBlocked = 0
              }
              state.decisionBlocked = 0
            })
            state._socket.on('disconnect', function (data) {
              sendNotification('Disconnected from the SyncLounge server')
              if (data === 'io client disconnect') {
                console.log('We disconnected from the server')
                commit('SET_ROOM', null)
                commit('SET_PASSWORD', null)
                commit('SET_USERS', [])
                commit('SET_CONNECTED', false)
                commit('SET_SERVER', null)
                state.serverError = null
              }
              if (data === 'transport close') {
                console.log('The server disconnected on us')
              }
            })
            state._socket.on('new_message', function (msgObj) {
              commit('ADD_MESSAGE', msgObj)
            })
          } else {
            commit('SET_ME', null)
            commit('SET_ROOM', null)
            commit('SET_PASSWORD', null)
            commit('SET_USERS', [])
          }
          return resolve(result)
        })
      })
    },
    disconnectServer ({ state, commit, rootState }) {
      return new Promise((resolve, reject) => {
        console.log('Decided we should disconnect from the SL Server.')
        state._socket.disconnect()
        commit('SET_ROOM', null)
        commit('SET_PASSWORD', null)
        commit('SET_USERS', [])
        commit('SET_CONNECTED', false)
        commit('SET_SERVER', null)
        resolve()
      })
    },
    sendNewMessage ({ state, commit, rootState }, msg) {
      commit('ADD_MESSAGE', {
        msg: msg,
        user: {
          username: 'You',
          thumb: rootState.plex.user.thumb
        },
        type: 'message'
      })
      if (state._socket.connected) {
        state._socket.emit('send_message', {
          msg: msg,
          type: 'message'
        })
      }
    },
    transferHost ({ state }, username) {
      if (state._socket.connected) {
        state._socket.emit('transfer_host', {
          username: username
        })
      }
    },
    getServerList () {}
  }
}
