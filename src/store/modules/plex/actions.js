var request = require('request')
var parseXMLString = require('xml2js').parseString

var _PlexAuth = require('./helpers/PlexAuth.js')
var PlexConnection = require('./helpers/PlexConnection.js')
var PlexServer = require('./helpers/PlexServer.js')
var PlexClient = require('./helpers/PlexClient.js')
var PlexAuth = new _PlexAuth()

export default {
  PLEX_LOGIN_TOKEN: ({ commit, dispatch, rootState }, token) => {
    return new Promise((resolve, reject) => {
      var options = PlexAuth.getApiOptions('https://plex.tv/users/sign_in.json', token, 5000, 'POST')
      options.headers['X-Plex-Client-Identifier'] = rootState.settings.CLIENTIDENTIFIER
      request(options, (error, response, body) => {
        if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
          let data = JSON.parse(body)
          if (!data) {
            commit('PLEX_SET_VALUE', ['signedin', false])
            return reject(new Error('No response data from Plex'))
          }
          commit('PLEX_SET_VALUE', ['user', data.user])
          commit('PLEX_SET_VALUE', ['signedin', true])
          dispatch('PLEX_GET_DEVICES')
          // state.signedin = true
          return resolve(true)
        } else {
          commit('PLEX_SET_VALUE', ['signedin', false])
          return reject(error)
        }
      })
    })
  },

  PLEX_LOGIN_STANDARD: ({ dispatch, commit }, data) => {
    return new Promise((resolve, reject) => {
      let { username, password } = data
      var base64encoded = new Buffer(username + ':' + password).toString('base64')
      var options = {
        url: 'https://plex.tv/users/sign_in.json',
        headers: {
          'Authorization': 'Basic ' + base64encoded,
          'X-Plex-Client-Identifier': 'PlexTogether'
        },
        method: 'POST'
      }
      request(options, function (error, response, body) {
        if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
          let data = JSON.parse(body)
          if (!data) {
            commit('PLEX_SET_VALUE', ['signedin', false])
            return reject(response.statusCode)
          } else {
            commit('PLEX_SET_VALUE', ['user', data.user])
            commit('PLEX_SET_VALUE', ['signedin', true])
            dispatch('PLEX_GET_DEVICES')
          }
        } else {
          commit('PLEX_SET_VALUE', ['signedin', false])
          return reject(response.statusCode)
        }
      })
    })
  },

  PLEX_GET_DEVICES: ({ state, commit, dispatch }) => {
    return new Promise((resolve, reject) => {
      if (!state.user) {
        return reject(new Error('Sign in before getting devices'))
      }

      commit('PLEX_SET_VALUE', ['gotDevices', false])
      commit('PLEX_SET_VALUE', ['servers', {}])
      commit('PLEX_SET_VALUE', ['clients', {}])
      var options = PlexAuth.getApiOptions('https://plex.tv/api/resources?includeHttps=1', state.user.authToken, 5000, 'GET')
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          // Valid response
          parseXMLString(body, async (err, result) => {
            if (err) {
              return reject(err)
            }
            for (var index in result.MediaContainer.Device) {
              // Handle the individual device
              let device = result.MediaContainer.Device[index]['$']
              // Each device can have multiple network connections
              // Any of them can be viable routes to interacting with the device
              let connections = result.MediaContainer.Device[index]['Connection']
              let tempConnectionsArray = []
              // Create a temporary array of object:PlexConnection
              for (var i in connections) {
                let connection = connections[i]['$']
                // Exclude local IPs starting with 169.254
                if (!connection.address.startsWith('169.254')) {
                  let tempConnection = new PlexConnection()
                  for (var key in connection) {
                    tempConnection[key] = connection[key]
                  }
                  tempConnectionsArray.push(tempConnection)
                  if (connection.local === '1' && connection.uri.indexOf('plex') > -1) {
                    let rawConnection = new PlexConnection()
                    Object.assign(rawConnection, connection)
                    rawConnection.uri = connection.protocol + '://' + connection.address + ':' + connection.port
                    rawConnection.isManual = true
                    tempConnectionsArray.push(rawConnection)
                  }
                }
              }
              if (device.provides.indexOf('player') !== -1) {
                // This is a Client
                // Create a new PlexClient object
                var tempClient = new PlexClient()
                for (let key in device) {
                  tempClient[key] = device[key]
                }
                tempClient.plexConnections = tempConnectionsArray
                dispatch('PLEX_ADD_CLIENT', tempClient)
              } else {
                // This is a Server
                // Create a new PlexServer object
                let tempServer = new PlexServer()
                for (let key in device) {
                  tempServer[key] = device[key]
                }
                // Push a manual connection string for when DNS rebind doesnt work
                tempServer.plexConnections = tempConnectionsArray
                if (tempServer['accessToken'] == null) {
                  tempServer['accessToken'] = state.user.authToken
                }

                dispatch('PLEX_ADD_SERVER', tempServer)
              }
            }
            // Setup our slPlayer
            let ptplayer = new PlexClient()
            ptplayer.provides = 'player'
            ptplayer.clientIdentifier = 'PTPLAYER9PLUS10'
            ptplayer.platform = 'Web'
            ptplayer.device = 'Web'
            ptplayer.product = 'SyncLounge'
            ptplayer.name = 'SyncLounge Player (BETA)'
            ptplayer.lastSeenAt = Math.round((new Date()).getTime() / 1000)

            dispatch('PLEX_ADD_CLIENT', ptplayer)
            commit('PLEX_SET_VALUE', ['gotDevices', true])
            dispatch('PLEX_REFRESH_SERVER_CONNECTIONS')
            return resolve(true)
          })
        } else {
          // Invalid response
          commit('PLEX_SET_VALUE', ['gotDevices', true])
          return reject(new Error('Invalid Response'))
        }
      })
    })
  },

  PLEX_REFRESH_SERVER_CONNECTIONS: ({ state, dispatch }) => {
    for (let id in state.servers) {
      let server = state.servers[id]
      dispatch('PLEX_SERVER_FINDCONNECTION', server).catch(() => {})
    }
  },

  PLEX_SERVER_FINDCONNECTION: async ({ state }, server) => {
    return server.findConnection()
  },

  PLEX_ADD_CLIENT: ({ commit, dispatch }, client) => {
    commit('PLEX_CLIENT_SET', client)
    commit('PLEX_CLIENT_SET_VALUE', [client, 'commit', commit])
    commit('PLEX_CLIENT_SET_VALUE', [client, 'dispatch', dispatch])
  },
  PLEX_ADD_SERVER: ({ commit }, server) => {
    commit('PLEX_SERVER_SET', server)
    commit('PLEX_SERVER_SET_VALUE', [server, 'commit', commit])
  },

  PLEX_CLIENT_FINDCONNECTION: ({ commit }, client) => {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.
    /*eslint-disable */
    return new Promise((resolve, reject) => {
      if (client.clientIdentifier === 'PTPLAYER9PLUS10') {
        return resolve(true)
      }

      let resolved = false
      try {
        Promise.all(client.plexConnections.map((connection) => {
          return new Promise((_resolve, reject) => {
            try {
              client.hitApi('/player/timeline/poll', { wait: 0 }, connection).then(() => {
                if (!resolved) {
                  resolved = true
                  commit('PLEX_CLIENT_SET_CONNECTION', {
                    client,
                    connection
                  })
                  _resolve(true)
                  resolve(true)
                }
              })
                .catch((e) => {
                  return _reject(e)
                })
            } catch (e) {
              return _reject(e)
            }
          })
        })).then(() => {
          if (!resolved) {
            return reject()
          }
        }).catch((e) => {
          return reject(e)
        })
      } catch (e) {
        throw new Error(e)
      }
    })
    /* eslint-enable */
  },

  PLEX_CLIENT_UPDATETIMELINE: ({}, data) => {
    let [client, timeline] = data
    console.log('Updating timeline for', client, 'with', timeline)
  }

}
