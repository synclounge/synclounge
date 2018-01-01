var request = require('request')
var safeParse = require('safe-json-parse/callback')
var parseXMLString = require('xml2js').parseString
var PlexTv = require('./PlexTv.js')
var PlexClient = require('./PlexClient.js')
var PlexConnection = require('./PlexConnection.js')
var _PlexAuth = require('./PlexAuth.js')
var PlexAuth = new _PlexAuth()

module.exports = function PlexServer () {
    this.name
    this.product
    this.productVersion
    this.platform
    this.platformVersion
    this.device
    this.clientIdentifier
    this.createdAt
    this.lastSeenAt
    this.provides
    this.owned
    this.httpsRequired
    this.ownerId
    this.home
    this.accessToken
    this.sourceTitle
    this.synced
    this.relay
    this.publicAddressMatches
    this.presence
    this.plexConnections
    this.chosenConnection = null

    this.commit

    this.setValue = function (key, value) {
        this[key] = value
        this.commit('PLEX_SERVER_SET_VALUE', [this, key, value])
    }

    // Functions
    this.hitApi = function (command, params) {
        return new Promise(async (resolve, reject) => {
            try {
                let query = ''
                //console.log('Query params: ' + JSON.stringify(params))
                for (let key in params) {
                    query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
                }
                if (!this.chosenConnection) {
                    let result = await this.findConnection()
                    if (!result) {
                        return reject('Failed to find a connection')
                    }
                }
                var _url = this.chosenConnection.uri + command + '?' + query
                var options = PlexAuth.getApiOptions(_url, this.accessToken, 15000, 'GET')
                request(options, (error, response, body) => {
                    if (!error) {
                        let parsed = JSON.parse(body)
                        console.log('Metadata request result', parsed)
                        this.handleMetadata(parsed)
                        return resolve(parsed)
                    }
                    else return reject(false, error)
                })
            } catch (e) {
                console.log(e)
                reject(e)
            }      
        })    
    }
    this.hitApiTestConnection = async function (command, connection) {
        return new Promise(async (resolve, reject) => {
            var _url = connection.uri + command
            var options = PlexAuth.getApiOptions(_url, this.accessToken, 7500, 'GET')
            request(options, function (error, response, body) {
                if (!error) {
                    safeParse(body, function (err, json) {
                        if (err) {
                            return reject(err)
                        }
                        return resolve(json)
                    })
                } else {
                    return reject(null)
                }
            })
        })   
    }
    this.setChosenConnection = function (con) {
        this.chosenConnection = con
        return
    }
    this.findConnection = function () {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.
        let resolved = false

        return new Promise(async (resolve, reject) => {
            await Promise.all(this.plexConnections.map(async (connection, index) => {
                return new Promise(async (_resolve, _reject) => {
                    try {
                        let result = await this.hitApiTestConnection('', connection)
                        if (result) {
                            resolved = true
                            //console.log('Succesfully connected to', server, 'via', connection)
                            this.setValue('chosenConnection', connection)
                            resolve(true)
                        }
                        _resolve(false)
                    } catch (e) {
                        _resolve(false)
                    }
                })
            }))
            if (!resolved) {
                reject('Unable to find a connection')
            }
        })
    }

    //Functions for dealing with media
    this.search = async function (searchTerm) {
    //This function hits the PMS using the /search endpoint and returns what the server returns if valid
        let result = await this.hitApi('/search', { query: searchTerm })
        let validResults = []
        if (result && result.MediaContainer) {
            if (result.MediaContainer.Metadata) {
                for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
                    validResults.push(result.MediaContainer.Metadata[i])
                }
            }
            return validResults
        }
        return null
    }

    this.getMediaByRatingKey = async function (ratingKey) {
    //This function hits the PMS and returns the item at the ratingKey
        try {
            let data = await this.hitApi('/library/metadata/' + ratingKey, {})
            if (data && data.MediaContainer.librarySectionID) {
                this.commit('SET_LIBRARYCACHE', [data.MediaContainer.librarySectionID, this.clientIdentifier, data.MediaContainer.librarySectionTitle])
            }
            return data
        } catch (e) {
            console.log(e)
            return false
        }
    // return this.handleMetadata(data)
    }
    this.markWatchedByRatingKey = function (ratingKey) {
        return this.hitApi('/:/scrobble', {
            identifier: 'com.plexapp.plugins.library',
            key: ratingKey
        })
    }
    this.getUrlForLibraryLoc = function (location, width, height, blur) {
        if (!(blur > 0)) {
            blur = 0
        }
        return this.chosenConnection.uri + '/photo/:/transcode?url=' + location + '&X-Plex-Token=' + this.accessToken + '&height=' + Math.floor(height) + '&width=' + Math.floor(width) + '&blur=' + blur
    }
    this.getRandomItem = async function () {
        try {
            let data = await this.getAllLibraries() 
            if (!data || !data.MediaContainer || !data.MediaContainer.Directory) {
                return false
            }
            let libraries = data.MediaContainer.Directory
            let library = libraries[Math.floor(Math.random() * libraries.length)]

            let result = await this.getLibraryContents(library.key, 0, 50)
            if (!result) {
                return false
            }
            let items = result.MediaContainer.Metadata
            let item = items[Math.floor(Math.random()*items.length)]
            return item
      
        } catch (e) {
            console.log(e) 
            throw new Error(e)
        }
    }
    this.getAllLibraries = async function () {
        try {
            let data = await this.hitApi('/library/sections', {})
            console.log('Library data', data)
            if (data && data.MediaContainer) {
                data.MediaContainer.Directory.forEach((library) => {
                    this.commit('SET_LIBRARYCACHE', [library.key, this.clientIdentifier, library.title ])
                })
            }
            return data
        } catch (e) {
            return false
        }
    }
    this.getLibraryContents = async function (key, start, size) {
        try {
            let data = await this.hitApi('/library/sections/' + key + '/all', {
                'X-Plex-Container-Start': start,
                'X-Plex-Container-Size': size,
                'excludeAllLeaves': 1
            })
            for (let i = 0; i < data.MediaContainer.Metadata.length; i++) {
                data.MediaContainer.Metadata[i].librarySectionID = key
                // this.commit('SET_ITEMCACHE', [data.MediaContainer.Metadata[i].ratingKey, 
                // data.MediaContainer.Metadata[i]])        
            }
            return data
        } catch (e) {
            console.log(e)
            return false
        }
    }
    this.getRelated = function (key, count) {
        return this.hitApi('/hubs/metadata/' + key + '/related', {
            'count': count || 10
        })
    }
    this.getRecentlyAddedAll = function (start, size) {
        return this.hitApi('/library/recentlyAdded', {})
    }
    this.getOnDeck = function (start, size) {
        return this.hitApi('/library/onDeck', {
            'X-Plex-Container-Start': start,
            'X-Plex-Container-Size': size,
        })
    }
    this.getRelated = function (ratingKey, size) {
        ratingKey = ratingKey.replace('/library/metadata/','')
        return this.hitApi('/hubs/metadata/' + ratingKey + '/related', {
            excludeFields: 'summary',
            count: 12
        })
    }
    this.getSeriesData = function (ratingKey) {
        return this.hitApi('/library/metadata/' + ratingKey, {
            includeConcerts: 1,
            includeExtras: 1,
            includeOnDeck: 1,
            includePopularLeaves: 1,
            asyncCheckFiles: 1,
            asyncRefreshAnalysis: 1,
            asyncRefreshLocalMediaAgent: 1
        })
    }
  
    this.getSeriesChildren = async function (ratingKey, start, size, excludeAllLeaves, library) {
        try {
            let data = await this.hitApi('/library/metadata/' + ratingKey + '/children', {
                'X-Plex-Container-Start': start,
                'X-Plex-Container-Size': size,
                excludeAllLeaves: excludeAllLeaves
            })
            if (library) {
                for (let i = 0; i < data.MediaContainer.Metadata.length; i++) {
                    data.MediaContainer.Metadata[i].librarySectionID = library
                    // this.commit('SET_ITEMCACHE', [data.MediaContainer.Metadata[i].ratingKey, 
                    // data.MediaContainer.Metadata[i]])        
                }
            } 
            return data
        } catch (e) {
            console.log(e)
            return false
        }
    }

    this.handleMetadata = function (result) {
        if (result) {
            if (result.MediaContainer && result.MediaContainer.Metadata && result.MediaContainer.Metadata.length > 0) {
                for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
                    result.MediaContainer.Metadata[i].machineIdentifier = this.clientIdentifier
                    if (result.MediaContainer.Metadata[i].ratingKey) {
                        this.commit('SET_ITEMCACHE', [result.MediaContainer.Metadata[i].ratingKey, 
                            result.MediaContainer.Metadata[i]])    
                    }
                }
            } else {
                if (result.MediaContainer.ratingKey) {
                    this.commit('SET_ITEMCACHE', [result.MediaContainer.ratingKey, result.MediaContainer])
                }
            }
            return result.MediaContainer.Metadata
        }
    }
}
