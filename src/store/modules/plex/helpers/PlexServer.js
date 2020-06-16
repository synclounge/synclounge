import axios from 'axios';
import plexauth from './PlexAuth';

class PlexServer {
  constructor(params) {
    this.name = '';
    this.product = '';
    this.productVersion = '';
    this.platform = '';
    this.device = '';
    this.clientIdentifier = '';
    this.lastSeenAt = '';
    this.provides = '';
    this.owned = '';
    this.ownerId = '';
    this.accessToken = '';
    this.sourceTitle = '';
    this.relay = '';
    this.publicAddressMatches = '';
    this.chosenConnection = null;

    this.commit = null;

    Object.assign(this, params);
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

  async getRandomItem() {
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
}

export default PlexServer;
