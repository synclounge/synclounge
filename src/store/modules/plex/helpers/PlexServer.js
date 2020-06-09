import axios from 'axios';
import plexauth from './PlexAuth';


class PlexServer {
  constructor() {
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
  }

  setValue(key, value) {
    this[key] = value;
    this.commit('PLEX_SERVER_SET_VALUE', [this, key, value]);
  }

  // Functions
  async hitApi(command, params) {
    if (!this.chosenConnection) {
      const result = await this.findConnection();
      if (!result) {
        throw new Error('Failed to find a connection');
      }
    }

    const options = plexauth.getApiOptions('', this.accessToken, 15000, 'GET');
    const { data } = await axios.get(this.chosenConnection.uri + command, {
      params,
      headers: options.headers,
    });

    this.handleMetadata(data);
    return data;
  }

  setChosenConnection(con) {
    this.chosenConnection = con;
  }

  // Functions for dealing with media
  async search(searchTerm) {
    // This function hits the PMS using the /search endpoint and returns what the server returns if valid
    const result = await this.hitApi('/search', { query: searchTerm });
    return result.MediaContainer.Metadata;
  }

  async getMediaByRatingKey(ratingKey) {
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
  }

  markWatchedByRatingKey(ratingKey) {
    return this.hitApi('/:/scrobble', {
      identifier: 'com.plexapp.plugins.library',
      key: ratingKey,
    });
  }

  getPostplay(ratingKey) {
    return this.hitApi(`/hubs/metadata/${ratingKey}/postplay`, {
      'X-Plex-Token': this.accessToken,
    });
  }

  getUrlForLibraryLoc(location, width, height, blur) {
    if (this.chosenConnection) {
      return `${this.chosenConnection.uri}/photo/:/transcode?url=${location}&X-Plex-Token=${
        this.accessToken
      }&height=${Math.floor(height)}&width=${Math.floor(width)}&blur=${blur}`;
    }
    return '';
  }

  async getRandomItem() {
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
  }

  async getAllLibraries() {
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
  }

  async getLibraryContents(key, start, size) {
    try {
      const data = await this.hitApi(`/library/sections/${key}/all`, {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves: 1,
      });

      for (let i = 0; i < data.MediaContainer.Metadata.length; i += 1) {
        data.MediaContainer.Metadata[i].librarySectionID = key;
        // this.commit('SET_ITEMCACHE', [data.MediaContainer.Metadata[i].ratingKey,
        // data.MediaContainer.Metadata[i]])
      }
      return data;
    } catch (e) {
      return false;
    }
  }

  getRecentlyAddedAll() {
    return this.hitApi('/library/recentlyAdded', {});
  }

  getOnDeck(start, size) {
    return this.hitApi('/library/onDeck', {
      'X-Plex-Container-Start': start,
      'X-Plex-Container-Size': size,
    });
  }

  getRelated(ratingKey, size) {
    return this.hitApi(`/hubs/metadata/${ratingKey}/related`, {
      excludeFields: 'summary',
      count: size,
    });
  }

  getSeriesData(ratingKey) {
    return this.hitApi(`/library/metadata/${ratingKey}`, {
      includeConcerts: 1,
      includeExtras: 1,
      includeOnDeck: 1,
      includePopularLeaves: 1,
      asyncCheckFiles: 1,
      asyncRefreshAnalysis: 1,
      asyncRefreshLocalMediaAgent: 1,
    });
  }

  async getSeriesChildren(ratingKey, start, size, excludeAllLeaves, library) {
    try {
      const data = await this.hitApi(`/library/metadata/${ratingKey}/children`, {
        'X-Plex-Container-Start': start,
        'X-Plex-Container-Size': size,
        excludeAllLeaves,
      });
      if (library) {
        for (let i = 0; i < data.MediaContainer.Metadata.length; i += 1) {
          data.MediaContainer.Metadata[i].librarySectionID = library;
          // this.commit('SET_ITEMCACHE', [data.MediaContainer.Metadata[i].ratingKey,
          // data.MediaContainer.Metadata[i]])
        }
      }
      return data;
    } catch (e) {
      return false;
    }
  }

  handleMetadata(result) {
    // This data is used in our router breadcrumbs
    if (result) {
      if (result.MediaContainer
        && result.MediaContainer.Metadata
        && result.MediaContainer.Metadata.length > 0
      ) {
        result.MediaContainer.Metadata.forEach((item) => {
          if (item.ratingKey) {
            this.commit('SET_ITEMCACHE', [
              item.ratingKey,
              {
                ...item,
                machineIdentifier: this.clientIdentifier,
              },
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
        });
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
    }
  }
}

export default PlexServer;
