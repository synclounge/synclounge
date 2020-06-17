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
}

export default PlexServer;
