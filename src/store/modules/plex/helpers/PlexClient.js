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

  async sync(hostTime, SYNCFLEXIBILITY, SYNCMODE, POLLINTERVAL) {
    const hostTimeline = hostTime;
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      await this.getTimeline();
    }
    const lastCommandTime = Math.abs(this.lastSyncCommand - new Date().getTime());
    if (this.lastSyncCommand && this.clientIdentifier !== 'PTPLAYER9PLUS10' && lastCommandTime < POLLINTERVAL) {
      throw new Error('too soon for another sync command');
    }
    const lagTime = Math.abs(hostTimeline.recievedAt - new Date().getTime());
    if (lagTime) {
      hostTimeline.time += lagTime;
    }
    const timelineAge = new Date().getTime() - this.lastTimelineObject.recievedAt;
    const ourTime = parseInt(this.lastTimelineObject.time, 10) + parseInt(timelineAge, 10);
    const difference = Math.abs((parseInt(ourTime, 10)) - parseInt(hostTimeline.time, 10));
    // console.log('Difference with host is', difference);
    const bothPaused = hostTimeline.playerState === 'paused' && this.lastTimelineObject.state === 'paused';

    if (parseInt(difference, 10) > parseInt(SYNCFLEXIBILITY, 10)
        || (bothPaused && difference > 10)) {
      // We need to seek!
      this.lastSyncCommand = new Date().getTime();
      // Decide what seeking method we want to use
      if (SYNCMODE === 'cleanseek' || hostTimeline.playerState === 'paused') {
        return this.cleanSeek(hostTimeline.time);
      }
      if (SYNCMODE === 'skipahead') {
        return this.skipAhead(hostTimeline.time, 10000);
      }
      // Fall back to skipahead
      return this.skipAhead(hostTimeline.time, 10000);
    }
    // Calc the average delay of the last 10 host timeline updates
    // We do this to avoid any issues with random lag spikes
    this.differenceCache.unshift(difference);
    if (this.differenceCache.length > 5) {
      this.differenceCache.pop();
    }
    let total = 0;
    for (let i = 0; i < this.differenceCache.length; i += 1) {
      total += this.differenceCache[i];
    }
    const avg = total / this.differenceCache.length;
    if (this.clientIdentifier === 'PTPLAYER9PLUS10' && avg > 1500) {
      console.log('Soft syncing because difference is', difference);
      return this.cleanSeek(hostTimeline.time, true);
    }
    return 'No sync needed';
  }
}

export default PlexClient;
