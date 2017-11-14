var request = require('request')
var parseXMLString = require('xml2js').parseString

var _PlexAuth = require('./helpers/PlexAuth.js')
var PlexConnection = require('./helpers/PlexConnection.js')
var PlexServer = require('./helpers/PlexServer.js')
var PlexClient = require('./helpers/PlexClient.js')
var PlexAuth = new _PlexAuth()


export default {
    PLEX_LOGIN_TOKEN: ({ state, commit, dispatch }, token) => {
        return new Promise((resolve, reject) => {
            var options = PlexAuth.getApiOptions('https://plex.tv/users/sign_in.json', token, 5000, 'POST')
            request(options, (error, response, body) => {
                if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
                    let data = JSON.parse(body)
                    if (!data) {
                        commit('PLEX_SET_VALUE', ['signedin', false])
                        return reject()
                    }
                    console.log('Signed in!')
                    commit('PLEX_SET_VALUE', ['user', data.user])
                    commit('PLEX_SET_VALUE', ['signedin', true])
                    dispatch('PLEX_GET_DEVICES')
                    // state.signedin = true
                    return resolve(true)
                } else {
                    commit('PLEX_SET_VALUE', ['signedin', false])
                    return reject()
                }
            })
        })
    },

    PLEX_LOGIN_STANDARD: ({ state, dispatch, commit }, data) => {
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
                if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
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

    PLEX_GET_DEVICES: ({ state, commit, rootState, dispatch }) => {
        return new Promise((resolve, reject) => {
            if (!state.user) {
              console.log('Must be logged in to retrieve devices!')
              return reject('Sign in before getting devices')
            }

            commit('PLEX_SET_VALUE', ['gotDevices', false])
            commit('PLEX_SET_VALUE', ['servers', {}])
            commit('PLEX_SET_VALUE', ['clients', {}])
            console.log('Retrieving devices for ' + state.user.username)
            var options = PlexAuth.getApiOptions('https://plex.tv/api/resources?includeHttps=1', state.user.authToken, 5000, 'GET')
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    //Valid response
                    parseXMLString(body, async (err, result) => {
                        for (var index in result.MediaContainer.Device) {
                            //Handle the individual device
                            let device = result.MediaContainer.Device[index]['$']
                            //Each device can have multiple network connections
                            //Any of them can be viable routes to interacting with the device
                            let connections = result.MediaContainer.Device[index]['Connection']
                            let tempConnectionsArray = []
                            //Create a temporary array of object:PlexConnection
                            for (var i in connections) {
                            let connection = connections[i]['$']
                            //Exclude local IPs starting with 169.254
                            if (!connection.address.startsWith('169.254')) {
                                let tempConnection = new PlexConnection()
                                    for (var key in connection) {
                                        tempConnection[key] = connection[key]
                                    }
                                    tempConnectionsArray.push(tempConnection)
                                }
                            }
                            //this.all_devices.push(device)
                            if (device.provides.indexOf('player') != -1) {
                                //This is a Client
                                //Create a new PlexClient object
                                var tempClient = new PlexClient()
                                for (var key in device) {
                                    tempClient[key] = device[key]
                                }
                                tempClient.plexConnections = tempConnectionsArray
                                commit('PLEX_ADD_CLIENT', tempClient)
                            } else {
                                //This is a Server
                                //Create a new PlexServer object
                                let tempServer = new PlexServer()
                                for (var key in device) {
                                    tempServer[key] = device[key]
                                }
                                tempServer.plexConnections = tempConnectionsArray
                                if (tempServer['accessToken'] == null) {
                                    tempServer['accessToken'] = state.user.authToken
                                }

                                commit('PLEX_ADD_SERVER', tempServer)
                                //that.servers.push(tempServer)
                                // tempServer.findConnection().then((result) => {
                                //     if (result) {
                                //         this.servers.push(tempServer)
                                //     }
                                // })
                            }
                        }
                        let ptplayer = new PlexClient()
                        ptplayer.provides = 'player'
                        ptplayer.clientIdentifier = 'PTPLAYER9PLUS10'
                        ptplayer.platform = 'Web'
                        ptplayer.device = 'Web'
                        ptplayer.product = 'PlexTogether'
                        ptplayer.name = 'PlexTogether Player (BETA)'
                        ptplayer.lastSeenAt = Math.round((new Date).getTime() / 1000)
                
                        commit('PLEX_ADD_CLIENT', ptplayer)
                        // this.clients.sort(function (a, b) {
                        //     return parseInt(b.lastSeenAt) - parseInt(a.lastSeenAt)
                        // })
                
                        // Setup our PTPlayer  
                        console.log('Succesfully retrieved all Plex Devices')
                        commit('PLEX_SET_VALUE', ['gotDevices', true])
                        dispatch('PLEX_REFRESH_SERVER_CONNECTIONS')
                        return resolve(true)
                    })
                } else {
                    //Invalid response
                    commit('PLEX_SET_VALUE', ['gotDevices', true])
                    return reject(false)
                }
            })
        })
    },

    PLEX_GET_RANDOMTHUMB: ({ state }) => {
        return new Promise((resolve, reject) => {
            let validServers = state.servers.filter((server) => {
                if (server.chosenConnection){
                  return true
                }
                return false
            })
            if (validServers.length > 1){
                let randomServer = validServers[Math.floor(Math.random() * validServers.length)]
                randomServer.getRandomItem((result) => {
                    console.log('Random item result', result)
                    if (!result){
                        return reject(false)
                    }
                    return resolve(randomServer.getUrlForLibraryLoc(result.thumb, 900, 900, 8))
                })
            } else {
                reject()
            }
        })
    },

    PLEX_REFRESH_SERVER_CONNECTIONS: ({ state, dispatch, commit }) => {
        for (let id in state.servers) {
            let server = state.servers[id]
            dispatch('PLEX_SERVER_FINDCONNECTION', server)
        }
    },

    PLEX_SERVER_FINDCONNECTION: ({ state, commit }, server) => {
        //This function iterates through all available connections and
        // if any of them return a valid response we'll set that connection
        // as the chosen connection for future use.
        let resolved = false
        
        return new Promise(async (resolve, reject) => {
            await Promise.all(server.plexConnections.map(async (connection, index) => {
                return new Promise(async (_resolve, _reject) => {
                    try {
                        let result = await server.hitApiTestConnections('', connection)
                        if (result) {
                            resolved = true
                            //console.log('Succesfully connected to', server, 'via', connection)
                            commit('PLEX_SERVER_SET_CONNECTION', {
                                server, connection
                            })
                            return resolve()
                        }
                        _resolve(false)
                    } catch (e) {
                        _reject(e)
                    }
                })
            }))
            if (!resolved) {
                reject('Unable to find a connection')
            }
        })
    },

    PLEX_CLIENT_FINDCONNECTION: ({ state, commit }, client) => {
        //This function iterates through all available connections and
        // if any of them return a valid response we'll set that connection
        // as the chosen connection for future use.
        let resolved = false
        
        return new Promise(async (resolve, reject) => {
            await Promise.all(client.plexConnections.map(async (connection, index) => {
                return new Promise(async (_resolve, _reject) => {
                    try {
                        let result = await client.hitApi('/player/timeline/poll', { wait: 0 }, connection, commit)
                        if (result) {
                            resolved = true
                            //console.log('Succesfully connected to', server, 'via', connection)
                            commit('PLEX_CLIENT_SET_CONNECTION', {
                                client, connection
                            })
                            return resolve()
                        }
                        _resolve(false)
                    } catch (e) {
                        _reject(e)
                    }
                })
            }))
            if (!resolved) {
                reject('Unable to find a connection')
            }
        })
    }

};
