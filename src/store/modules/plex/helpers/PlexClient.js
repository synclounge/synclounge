import axios from 'axios';
import xmlutils from '@/utils/xmlutils';
import { encodeUrlParams } from '@/utils/encoder';
import delay from '@/utils/delay';
import plexauth from './PlexAuth';

class PlexClient {
  constructor(params) {
    this.commandId = 0;
    this.name = null;
    this.product = null;
    this.platform = null;
    this.device = null;
    this.clientIdentifier = null;
    this.lastSeenAt = null;
    this.provides = null;
    this.owned = null;
    this.publicAddressMatches = null;
    this.plexConnections = null;
    this.chosenConnection = null;
    this.labels = [];

    this.lastSyncCommand = 0;

    // Latest objects for reference in the future
    this.lastRatingKey = null;
    this.lastTimelineObject = null;
    this.oldTimelineObject = null;
    this.lastTimeline = null;
    this.oldTimeline = null;
    this.clientPlayingMetadata = null;
    this.connectedstatus = 'fresh';

    this.commit = null;

    this.previousTimeline = {};
    this.differenceCache = [];

    Object.assign(this, params);
  }

  setValue(key, value) {
    this[key] = value;
    this.commit('PLEX_CLIENT_SET_VALUE', [this, key, value]);
  }

  async hitApi(command, params, con) {
    let connection = con;
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      return new Promise((resolve) => {
        // We are using the SyncLounge Player
        const data = {
          command,
          params,
          callback: (resultData) => {
            resolve(resultData);
          },
        };

        window.EventBus.$emit('command', data);
      });
    }

    if (!connection) {
      connection = this.chosenConnection;
    }
    if (!connection) {
      throw new Error('No connection specified');
    }

    Object.assign(params, {
      type: 'video',
      commandID: this.commandId,
    });

    const query = encodeUrlParams(params);

    if (connection.uri.charAt(connection.uri.length - 1) === '/') {
      // Remove a trailing / that some clients broadcast
      connection.uri = connection.uri.slice(0, connection.uri.length - 1);
    }
    const url = `${connection.uri + command}?${query}`;
    this.setValue('commandId', this.commandId + 1);
    const options = {
      ...plexauth.getClientApiOptions(this.clientIdentifier, 5000, this.accessToken),
      transformResponse: xmlutils.parseXML,
    };
    const { data } = await axios.get(url, options);

    return data;
  }


}

export default PlexClient;
