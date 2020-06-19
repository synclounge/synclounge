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

  pressPlay() {
    // Press play on the client
    return this.hitApi('/player/playback/play', { wait: 0 });
  }

  pressPause() {
    // Press pause on the client
    return this.hitApi('/player/playback/pause', { wait: 0 });
  }

  pressStop() {
    // Press pause on the client
    return this.hitApi('/player/playback/stop', { wait: 0 });
  }

  seekTo(time, params) {
    // Seek to a time (in ms)
    return this.hitApi('/player/playback/seekTo', { wait: 0, offset: Math.round(time), ...params });
  }

  waitForMovement(startTime) {
    return new Promise((resolve) => {
      let time = 500;
      if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
        time = 50;
      }
      const timer = setInterval(async () => {
        const now = await this.getTimeline();
        if (now.time !== startTime) {
          console.log('Player has movement!');
          resolve();
          clearInterval(timer);
        }
      }, time);
    });
  }

  async skipAhead(current, duration) {
    const startedAt = new Date().getTime();
    const now = this.lastTimelineObject.time;
    await this.seekTo(current + duration);
    await this.waitForMovement(now);
    // The client is now ready
    await this.pressPause();
    // Calculate how long it took to get to our ready state
    const elapsed = Math.abs(startedAt - new Date().getTime());
    await delay(duration - elapsed);
    await this.pressPlay();
  }

  cleanSeek(time, isSoft) {
    if (isSoft && this.clientIdentifier === 'PTPLAYER9PLUS10') {
      return this.seekTo(time, { softSeek: true });
    }
    return this.seekTo(time);
  }
}

export default PlexClient;
