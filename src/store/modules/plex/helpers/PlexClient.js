import axios from 'axios';
import parser from 'fast-xml-parser';

const EventEmitter = require('events');
const _PlexAuth = require('./PlexAuth.js');

const PlexAuth = new _PlexAuth();
const stringSimilarity = require('string-similarity');

module.exports = function PlexClient() {
  this.commandId = 0;
  this.name = null;
  this.product = null;
  this.productVersion = null;
  this.platform = null;
  this.platformVersion = null;
  this.device = null;
  this.clientIdentifier = null;
  this.createdAt = null;
  this.lastSeenAt = null;
  this.provides = null;
  this.owned = null;
  this.publicAddressMatches = null;
  this.presence = null;
  this.plexConnections = null;
  this.chosenConnection = null;
  this.httpServer = null;
  this.tempId = null;
  this.events = new EventEmitter();
  this.labels = [];

  this.lastSyncCommand = 0;

  this.userData = null;

  // Latest objects for reference in the future
  this.lastRatingKey = null;
  this.lastTimelineObject = null;
  this.oldTimelineObject = null;
  this.lastTimeline = null;
  this.oldTimeline = null;
  this.clientPlayingMetadata = null;
  this.lastSubscribe = 0;
  this.connectedstatus = 'fresh';

  this.eventbus = window.EventBus; // We will use this to communicate with the SLPlayer
  this.commit = null;
  this.dispatch = null;

  let previousTimeline = {};
  const differenceCache = [];

  this.setValue = function (key, value) {
    this[key] = value;
    this.commit('PLEX_CLIENT_SET_VALUE', [this, key, value]);
  };

  this.generateGuid = function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return `${s4() + s4()}-${s4()}`;
  };
  this.uuid = this.generateGuid();

  this.hitApi = async function (command, params, connection, needResponse, dontSub) {
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      return new Promise(async (resolve, reject) => {
        // We are using the SyncLounge Player
        const data = {
          command,
          params,
          callback: (resultData) => {
            resolve(resultData);
          },
        };
        this.eventbus.$emit('command', data);
      });
    }

    if (!connection) {
      connection = this.chosenConnection;
    }
    if (!connection) {
      throw new Error('No connection specified');
    }
    let query = '';
    Object.assign(params, {
      type: 'video',
      commandID: this.commandId,
    });
    for (const key in params) {
      query += `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}&`;
    }
    query = query.substring(0, query.length - 1);
    if (connection.uri.charAt(connection.uri.length - 1) === '/') {
      // Remove a trailing / that some clients broadcast
      connection.uri = connection.uri.slice(0, connection.uri.length - 1);
    }
    const _url = `${connection.uri + command}?${query}`;
    this.setValue('commandId', this.commandId + 1);
    const options = PlexAuth.getClientApiOptions(this.clientIdentifier, 5000, this.accessToken);
    const { data } = await axios.get(_url, options);
    if (needResponse) {
      return parser.parse(data);
    }
    return true;
  };

  this.getTimeline = function () {
    return new Promise(async (resolve, reject) => {
      let data;
      try {
        data = await this.hitApi('/player/timeline/poll', { wait: 0 }, this.chosenConnection, true);
        if (data) {
          return resolve(this.updateTimelineObject(data));
        }
        return reject(new Error('Invalid data recieved from client'));
      } catch (e) {
        return reject(e);
      }
    });
    // Get the timeline object from the client
  };

  this.updateTimelineObject = function (result) {
    // Check if we are the SLPlayer
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      // SLPLAYER
      const tempObj = {
        MediaContainer: {
          Timeline: [{ ...result }],
        },
      };
      result = tempObj;
      if (!previousTimeline.MediaContainer || result.MediaContainer.Timeline[0].ratingKey !== previousTimeline.MediaContainer.Timeline[0].ratingKey) {
        window.EventBus.$emit('PLAYBACK_CHANGE', [this, result.MediaContainer.Timeline[0].ratingKey, result.MediaContainer.Timeline[0]]);
      }
      previousTimeline = tempObj;
      this.lastTimelineObject = result.MediaContainer.Timeline[0];
      this.lastTimelineObject.recievedAt = new Date().getTime();
      window.EventBus.$emit('NEW_TIMELINE', result.MediaContainer.Timeline[0]);
      return result.MediaContainer.Timeline[0];
    }
    // Standard player
    const timelines = result.MediaContainer.Timeline;
    let videoTimeline = {};
    for (let i = 0; i < timelines.length; i++) {
      const _timeline = timelines[i].$;
      if (_timeline.type === 'video') {
        videoTimeline = _timeline;
        if (videoTimeline.ratingKey !== previousTimeline.ratingKey) {
          window.EventBus.$emit('PLAYBACK_CHANGE', [this, videoTimeline.ratingKey, videoTimeline]);
        }
      }
    }
    window.EventBus.$emit('NEW_TIMELINE', videoTimeline);
    previousTimeline = videoTimeline;
    this.lastTimelineObject = videoTimeline;
    this.lastTimelineObject.recievedAt = new Date().getTime();
    // this.setValue('lastTimelineObject', videoTimeline)
    return videoTimeline;
  };
  this.pressPlay = function () {
    // Press play on the client
    return this.hitApi('/player/playback/play', { wait: 0 });
  };

  this.pressPause = function () {
    // Press pause on the client
    return this.hitApi('/player/playback/pause', { wait: 0 });
  };
  this.pressStop = function () {
    // Press pause on the client
    return this.hitApi('/player/playback/stop', { wait: 0 });
  };
  this.seekTo = function (time, params) {
    // Seek to a time (in ms)
    return this.hitApi('/player/playback/seekTo', { wait: 0, offset: Math.round(time), ...params });
  };
  this.waitForMovement = function (startTime) {
    return new Promise((resolve, reject) => {
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
  };
  this.skipAhead = function (current, duration) {
    return new Promise(async (resolve, reject) => {
      const startedAt = new Date().getTime();
      const now = this.lastTimelineObject.time;
      await this.seekTo(current + duration);
      await this.waitForMovement(now);
      // The client is now ready
      await this.pressPause();
      // Calculate how long it took to get to our ready state
      const elapsed = Math.abs(startedAt - new Date().getTime());
      await wait(duration - elapsed);
      await this.pressPlay();
      resolve();
    });
  };
  this.cleanSeek = function (time, isSoft) {
    if (isSoft && this.clientIdentifier === 'PTPLAYER9PLUS10') {
      return this.seekTo(time, { softSeek: true });
    }
    return this.seekTo(time);
  };
  this.sync = function sync(hostTimeline, SYNCFLEXIBILITY, SYNCMODE, POLLINTERVAL) {
    return new Promise(async (resolve, reject) => {
      if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
        await this.getTimeline();
      }
      const lastCommandTime = Math.abs(this.lastSyncCommand - new Date().getTime());
      if (this.lastSyncCommand && this.clientIdentifier !== 'PTPLAYER9PLUS10' && lastCommandTime < POLLINTERVAL) {
        return reject(new Error('too soon for another sync command'));
      }
      const lagTime = Math.abs(hostTimeline.recievedAt - new Date().getTime());
      if (lagTime) {
        hostTimeline.time += lagTime;
      }
      const timelineAge = new Date().getTime() - this.lastTimelineObject.recievedAt;
      const ourTime = parseInt(this.lastTimelineObject.time) + parseInt(timelineAge);
      const difference = Math.abs((parseInt(ourTime)) - parseInt(hostTimeline.time));
      // console.log('Difference with host is', difference);
      const bothPaused = hostTimeline.playerState === 'paused' && this.lastTimelineObject.state === 'paused';

      if (parseInt(difference) > parseInt(SYNCFLEXIBILITY) || (bothPaused && difference > 10)) {
        // We need to seek!
        this.lastSyncCommand = new Date().getTime();
        // Decide what seeking method we want to use
        if (SYNCMODE === 'cleanseek' || hostTimeline.playerState === 'paused') {
          return resolve(await this.cleanSeek(hostTimeline.time));
        }
        if (SYNCMODE === 'skipahead') {
          return resolve(await this.skipAhead(hostTimeline.time, 10000));
        }
        // Fall back to skipahead
        return resolve(await this.skipAhead(hostTimeline.time, 10000));
      }
      // Calc the average delay of the last 10 host timeline updates
      // We do this to avoid any issues with random lag spikes
      differenceCache.unshift(difference);
      if (differenceCache.length > 5) {
        differenceCache.pop();
      }
      let total = 0;
      for (let i = 0; i < differenceCache.length; i++) {
        total += differenceCache[i];
      }
      const avg = total / differenceCache.length;
      if (this.clientIdentifier === 'PTPLAYER9PLUS10' && avg > 1500) {
        console.log('Soft syncing because difference is', difference);
        return resolve(await this.cleanSeek(hostTimeline.time, true));
      }
      return resolve('No sync needed');
    });
  };
  this.playMedia = async function (data) {
    // Play a media item given a mediaId key and a server to play from
    // We need the following variables to build our paramaters:
    // MediaId Key, Offset, server MachineId,
    // Server Ip, Server Port, Server Protocol, Path

    // First we will mirror the item so the user has an idea of what we're about to play
    return new Promise(async (resolve, reject) => {
      const command = '/player/playback/playMedia';
      const offset = Math.round(data.offset) || 0;
      const serverId = data.server.clientIdentifier;
      const uri = new URL(data.server.chosenConnection.uri);
      const address = uri.hostname;
      const port = uri.port !== '' ? uri.port : (uri.protocol === 'https:' ? '443' : '80'); // port not specified if standard
      const protocol = uri.protocol.replace(':', ''); // remove extra colon
      const path = data.server.chosenConnection.uri + data.key;

      const params = {
        'X-Plex-Client-Identifier': 'SyncLounge',
        key: data.key,
        offset,
        machineIdentifier: serverId,
        address,
        port,
        protocol,
        path,
        wait: 0,
        token: data.server.accessToken,
      };

      if (data.mediaIndex !== undefined || data.mediaIndex !== null) {
        params.mediaIndex = data.mediaIndex;
      }

      // Now that we've built our params, it's time to hit the client api
      await this.hitApi(command, params, this.chosenConnection);
      await this.waitForMovement();
      resolve(true);
    });
  };

  this.playContentAutomatically = function (client, hostData, servers, offset) {
    // Automatically play content on the client searching all servers based on the title
    return new Promise(async (resolve, reject) => {
      // First lets find all of our playable items
      let playables = [];
      const serversArr = [];
      for (const i in servers) {
        serversArr.push(servers[i]);
      }
      await Promise.all(serversArr.map(async (server) => new Promise(async (resolve, reject) => {
        if (!server.chosenConnection) {
          return resolve();
        }
        const results = await server.search(hostData.rawTitle);
        for (let k = 0; k < results.length; k++) {
          // Now we need to check the result
          if (checkResult(results[k], hostData)) {
            // Its a match!
            playables.push({
              server,
              result: results[k],
            });
          }
        }
        resolve();
      })));
      playables = playables.sort((a, b) => parseInt(b.server.publicAddressMatches) - parseInt(a.server.publicAddressMatches));
      const start = async (index) => {
        // Now lets try and play our items one by one
        if (playables.length === 0 || index === playables.length) {
          return reject(new Error('Didnt find any playable items'));
        }
        const { server } = playables[index];
        const { key } = playables[index].result;
        const data = {
          key,
          mediaIndex: 0,
          server,
          offset: offset || 0,
        };

        const res = await this.playMedia(data).catch(() => {
          start(parseInt(parseInt(index) + 1));
        });
        if (!res) {
          return;
        }
        return resolve();
      };
      start(0);

      function checkResult(data, hostData) {
        // Do a series of checks to see if this result is OK
        // Check if rawTitle matches
        if (data.title !== hostData.rawTitle) {
          return false;
        }
        // Check if length is close enough
        if (Math.abs(parseInt(data.duration) - parseInt(hostData.maxTime)) > 1000 || !data.duration) {
          return false;
        }
        if (data.type === 'movie') {
          // We're good!
          return true;
        }
        if (data.type === 'episode') {
          // Check if the show name is the same
          const similarity = stringSimilarity.compareTwoStrings(data.grandparentTitle, hostData.showName);
          return similarity > 0.40;
        }
        if (data.type === 'track') {
          // We're good!
          return true;
        }
        return false;
      }
    });
  };
  const wait = (ms) => new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
};
