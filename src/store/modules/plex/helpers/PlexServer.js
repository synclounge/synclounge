import axios from 'axios';
const _PlexAuth = require('./PlexAuth.js');

const PlexAuth = new _PlexAuth();


module.exports = function PlexServer() {
  this.name = '';
  this.product = '';
  this.productVersion = '';
  this.platform = '';
  this.platformVersion = '';
  this.device = '';
  this.clientIdentifier = '';
  this.createdAt = '';
  this.lastSeenAt = '';
  this.provides = '';
  this.owned = '';
  this.httpsRequired = '';
  this.ownerId = '';
  this.accessToken = '';
  this.sourceTitle = '';
  this.synced = '';
  this.relay = '';
  this.publicAddressMatches = '';
  this.presence = '';
  this.plexConnections = '';
  this.chosenConnection = null;

  this.commit = null;

  this.setValue = function (key, value) {
    this[key] = value;
    this.commit('PLEX_SERVER_SET_VALUE', [this, key, value]);
  };

  // Functions
  this.hitApi = function (command, params) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.chosenConnection) {
          const result = await this.findConnection();
          if (!result) {
            return reject(new Error('Failed to find a connection'));
          }
        }
        const options = PlexAuth.getApiOptions('', this.accessToken, 15000, 'GET');
        axios
          .get(this.chosenConnection.uri + command, {
            params,
            headers: options.headers,
          })
          .then((response) => {
            this.handleMetadata(response.data);
            resolve(response.data);
          })
          .catch((error) => {
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
  };
  this.hitApiTestConnection = async function (command, connection) {
    const _url = connection.uri + command;
    const config = PlexAuth.getRequestConfig(this.accessToken, 7500);
    const { data } = await axios.get(_url, config);
    return data;
  };
  this.setChosenConnection = function (con) {
    this.chosenConnection = con;
  };
  this.findConnection = function () {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.
    let resolved = false;

    return new Promise(async (resolve, reject) => {
      await Promise.all(
        this.plexConnections.map(
          async (connection, index) =>
            /*eslint-disable */
            new Promise(async (_resolve, _reject) => {
              try {
                let result = await this.hitApiTestConnection('', connection);
                if (result) {
                  resolved = true;
                  // console.log('Succesfully connected to', server, 'via', connection)
                  this.setValue('chosenConnection', connection);
                  resolve(true);
                }
                _resolve(false);
              } catch (e) {
                _resolve(false);
              }
            }),
          /* eslint-enable */
        ),
      );
      if (!resolved) {
        reject(new Error('Unable to find a connection'));
      }
    });
  };

  // Functions for dealing with media
  this.search = async function (searchTerm) {
    // This function hits the PMS using the /search endpoint and returns what the server returns if valid
    return new Promise(async (resolve, reject) => {
      const result = await this.hitApi('/search', { query: searchTerm });
      const validResults = [];
      if (result && result.MediaContainer) {
        if (result.MediaContainer.Metadata) {
          for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
            validResults.push(result.MediaContainer.Metadata[i]);
          }
        }
      }
      return resolve(validResults);
    });
  };

  this.getMediaByRatingKey = async function (ratingKey) {
    // This function hits the PMS and returns the item at the ratingKey
    try {
      const data = await this.hitApi(`/library/metadata/${ratingKey}`, {});
      if (data && data.MediaContainer.librarySectionID) {
        this.commit('SET_LIBRARYCACHE', [
          data.MediaContainer.librarySectionID,
          this.clientIdentifier,
          data.MediaContainer.librarySectionTitle,
        ]);
      }
      return data;
    } catch (e) {
      console.log(e);
      return false;
    }
    // return this.handleMetadata(data)
  };
  this.markWatchedByRatingKey = function (ratingKey) {
    return this.hitApi('/:/scrobble', {
      identifier: 'com.plexapp.plugins.library',
      key: ratingKey,
    });
  };
  this.getPostplay = function (ratingKey) {
    return this.hitApi(`/hubs/metadata/${ratingKey}/postplay`, {
      'X-Plex-Token': this.accessToken,
    });
  };
  this.getUrlForLibraryLoc = function (location, width, height, blur) {
    if (!(blur > 0)) {
      blur = 0;
    }
    if (this.chosenConnection) {
      return `${this.chosenConnection.uri}/photo/:/transcode?url=${location}&X-Plex-Token=${
        this.accessToken
      }&height=${Math.floor(height)}&width=${Math.floor(width)}&blur=${blur}`;
    }
    return '';
  };
  this.getRandomItem = async function () {
    try {
      const data = await this.getAllLibraries();
      if (!data || !data.MediaContainer || !data.MediaContainer.Directory) {
        return false;
      }
      const libraries = data.MediaContainer.Directory;
      const library = libraries[Math.floor(Math.random() * libraries.length)];

      const result = await this.getLibraryContents(library.key, 0, 50);
      if (!result) {
        return false;
      }
      const items = result.MediaContainer.Metadata;
      const item = items[Math.floor(Math.random() * items.length)];
      return item;
    } catch (e) {
      throw new Error(e);
    }
  };
  this.getAllLibraries = async function () {
    try {
      const data = await this.hitApi('/library/sections', {});
      if (data && data.MediaContainer) {
        data.MediaContainer.Directory.forEach((library) => {
          this.commit('SET_LIBRARYCACHE', [library.key, this.clientIdentifier, library.title]);
        });
      }
      return data;
    } catch (e) {
      return false;
    }
  };
  this.getLibraryContents = async function (key, start, size) {
    try {
      const data = await this.hitApi(`/library/sections/${key}/all`, {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves: 1,
      });
      for (let i = 0; i < data.MediaContainer.Metadata.length; i++) {
        data.MediaContainer.Metadata[i].librarySectionID = key;
        // this.commit('SET_ITEMCACHE', [data.MediaContainer.Metadata[i].ratingKey,
        // data.MediaContainer.Metadata[i]])
      }
      return data;
    } catch (e) {
      return false;
    }
  };
  this.getRecentlyAddedAll = function (start, size) {
    return this.hitApi('/library/recentlyAdded', {});
  };
  this.getOnDeck = function (start, size) {
    return this.hitApi('/library/onDeck', {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size,
    });
  };
  this.getRelated = function (ratingKey, size) {
    ratingKey = ratingKey.replace('/library/metadata/', '');
    return this.hitApi(`/hubs/metadata/${ratingKey}/related`, {
      excludeFields: 'summary',
      count: size,
    });
  };
  this.getSeriesData = function (ratingKey) {
    return this.hitApi(`/library/metadata/${ratingKey}`, {
      includeConcerts: 1,
      includeExtras: 1,
      includeOnDeck: 1,
      includePopularLeaves: 1,
      asyncCheckFiles: 1,
      asyncRefreshAnalysis: 1,
      asyncRefreshLocalMediaAgent: 1,
    });
  };

  this.getSeriesChildren = async function (ratingKey, start, size, excludeAllLeaves, library) {
    try {
      const data = await this.hitApi(`/library/metadata/${ratingKey}/children`, {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves,
      });
      if (library) {
        for (let i = 0; i < data.MediaContainer.Metadata.length; i++) {
          data.MediaContainer.Metadata[i].librarySectionID = library;
          // this.commit('SET_ITEMCACHE', [data.MediaContainer.Metadata[i].ratingKey,
          // data.MediaContainer.Metadata[i]])
        }
      }
      return data;
    } catch (e) {
      return false;
    }
  };

  this.handleMetadata = function (result) {
    // This data is used in our router breadcrumbs
    if (result) {
      if (
        result.MediaContainer
        && result.MediaContainer.Metadata
        && result.MediaContainer.Metadata.length > 0
      ) {
        for (let i = 0; i < result.MediaContainer.Metadata.length; i++) {
          result.MediaContainer.Metadata[i].machineIdentifier = this.clientIdentifier;
          const item = result.MediaContainer.Metadata[i];
          if (result.MediaContainer.Metadata[i].ratingKey) {
            this.commit('SET_ITEMCACHE', [
              result.MediaContainer.Metadata[i].ratingKey,
              result.MediaContainer.Metadata[i],
            ]);
          }
          if (item.grandparentRatingKey) {
            this.commit('SET_ITEMCACHE', [
              item.grandparentRatingKey,
              { title: item.grandparentTitle, machineIdentifier: this.clientIdentifier },
            ]);
          }
          if (item.parentRatingKey) {
            this.commit('SET_ITEMCACHE', [
              item.parentRatingKey,
              { title: item.parentTitle, machineIdentifier: this.clientIdentifier },
            ]);
          }
        }
      } else {
        if (result.MediaContainer.ratingKey) {
          this.commit('SET_ITEMCACHE', [result.MediaContainer.ratingKey, result.MediaContainer]);
        }
        if (result.MediaContainer.grandparentRatingKey) {
          this.commit('SET_ITEMCACHE', [
            result.MediaContainer.grandparentRatingKey,
            {
              title: result.MediaContainer.grandparentTitle,
              machineIdentifier: this.clientIdentifier,
            },
          ]);
        }
        if (result.MediaContainer.parentRatingKey) {
          this.commit('SET_ITEMCACHE', [
            result.MediaContainer.parentRatingKey,
            { title: result.MediaContainer.parentTitle, machineIdentifier: this.clientIdentifier },
          ]);
        }
      }
      return result.MediaContainer.Metadata;
    }
  };
};
