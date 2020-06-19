import router from '@/router';
import promiseutils from '@/utils/promiseutils';
import xmlutils from '@/utils/xmlutils';

export default {
  PLEX_CLIENT_FINDCONNECTION: async ({ commit }, client) => {
    // TODO: use this to authenticate again lol
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.

    if (client.clientIdentifier === 'PTPLAYER9PLUS10') {
      return true;
    }

    try {
      await promiseutils.any(client.connections.map(async (connection) => {
        // We dont care about this result, some clients require a poll command before sending a subscription command
        await client.hitApi('/player/timeline/poll', { wait: 0 }, connection, false, true)
          .catch(() => { });

        await client.hitApi('/player/timeline/poll', { wait: 0 }, connection);

        console.log('Got good response on', connection);
        commit('PLEX_CLIENT_SET_CONNECTION', { client, connection });
      }));

      return true;
    } catch (e) {
      console.error('Error connecting to client', e);
      throw e;
    }
  },

  PLEX_CLIENT_UPDATETIMELINE: (context, [client, timeline]) => {
    console.log('Updating timeline for', client, 'with', timeline);
  },

  PLEX_CLIENT_PLAY_MEDIA: async ({ getters, commit, rootGetters }, {
    key, mediaIndex, metadata, serverIdentifier, offset,
  }) => {
    const server = rootGetters['plexservers/GET_PLEX_SERVER'](serverIdentifier);

    if (getters.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10') {
      // do raw stuff
      // commit the proper stuff
      commit('SET_ACTIVE_MEDIA_METADATA', metadata);
      commit('SET_ACTIVE_SERVER_ID', serverIdentifier);
      commit('slplayer/SET_MEDIA_INDEX', mediaIndex, { root: true });
      commit('slplayer/SET_OFFSET_MS', Math.round(offset) || 0, { root: true });
      router.push('/player');
      // TODO: navigate there lol
    } else {
      // Play a media item given a mediaId key and a server to play from
      // We need the following variables to build our paramaters:
      // MediaId Key, Offset, server MachineId,
      // Server Ip, Server Port, Server Protocol, Path

      const command = '/player/playback/playMedia';

      const params = {
        'X-Plex-Client-Identifier': 'SyncLounge',
        key,
        offset: Math.round(offset) || 0,
        machineIdentifier: serverIdentifier,
        address: server.chosenConnection.address,
        port: server.chosenConnection.port,
        protocol: server.chosenConnection.protocol,
        path: server.chosenConnection.uri + key,
        wait: 0,
        token: server.accessToken,
      };

      if (mediaIndex) {
        params.mediaIndex = mediaIndex;
      }
      await getters.GET_CHOSEN_CLIENT.hitApi(command, params);
      await this.waitForMovement();
    }
  },

  SEND_CLIENT_REQUEST: async ({ getters, commit }, { path, params }) => {
    const { data } = await getters.GET_CHOSEN_PLEX_CLIENT_AXIOS.get(path, {
      params: {
        commandId: getters.GET_COMMAND_ID,
        type: 'video',
        ...params,
      },
      transformResponse: xmlutils.parseXML,
    });

    // TODO: maybe potentially increment it even if it fails
    commit('INCREMENT_COMMAND_ID');

    return data;
  },

  FETCH_CHOSEN_CLIENT_TIMELINE: async ({ dispatch }) => {
    const data = await dispatch('SEND_CLIENT_REQUEST', {
      url: '/player/timeline/poll',
      params: {
        wait: 0,
      },
    });

    const videoTimeline = data.MediaContainer[0].Timeline.find((timeline) => timeline.type === 'video');

    return {
      ...videoTimeline,
      time: parseInt(videoTimeline.time, 10),
      duration: parseInt(videoTimeline.duration, 10),
      receivedAt: Date.now(),
      commandID: parseInt(data.MediaContainer[0].commandID, 10),
    };
  },

  UPDATE_PLEX_CLIENT_TIMELINE: async ({ getters, dispatch, commit }, timeline) => {
    if (!getters.GET_PLEX_CLIENT_TIMELINE
      || getters.GET_PLEX_CLIENT_TIMELINE.machineIdentifier !== timeline.machineIdentifier
      || getters.GET_PLEX_CLIENT_TIMELINE.ratingKey !== timeline.ratingKey) {
      // If client has changed what it's playing
      // TODO: see what client sends when its stopped and set metadata and stuff to null instead if so
      commit('SET_ACTIVE_MEDIA_METADATA', await dispatch('FETCH_PLEX_METADATA', {
        machineIdentifier: timeline.machineIdentifier,
        ratingKey: timeline.ratingKey,
      }));

      commit('SET_ACTIVE_SERVER_ID', timeline.machineIdentifier);
      // TODO: do wahtever was in the playback changed event handler here
    }

    commit('SET_PLEX_CLIENT_TIMELINE', timeline);
    // TODO: do whatever was in the new timeline event handler here
  },

  POLL_PLEX_CLIENT: async ({ getters, dispatch }) => {
    const timeline = await dispatch('FETCH_CHOSEN_CLIENT_TIMELINE');

    await dispatch('UPDATE_PLEX_CLIENT_TIMELINE', timeline);

    return getters.GET_PLEX_CLIENT_POLL_DATA;
  },

  // Same return as FETCH_TIMELINE_POLL_DATA but usees the cached data (if normal plex client rather than making a request)
  // or asks slplayer since it can do that with no delay
  FETCH_TIMELINE_POLL_DATA_CACHE: ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/FETCH_TIMELINE_POLL_DATA', null, { root: true });
      }

      default: {
        return getters.GET_PLEX_CLIENT_POLL_DATA;
      }
    }
  },

  FETCH_TIMELINE_POLL_DATA: ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/FETCH_TIMELINE_POLL_DATA', null, { root: true });
      }

      default: {
        return dispatch('POLL_PLEX_CLIENT');
      }
    }
  },

  POLL_CLIENT: async ({ getters, dispatch }) => {
    const timelinePart = await dispatch('FETCH_TIMELINE_POLL_DATA');
    dispatch('HANDLE_NEW_TIMELINE', timelinePart, { root: true });

    return {
      ...getters.GET_ACTIVE_MEDIA_POLL_METADATA,
      ...timelinePart,

      // TODO: fix up roduct below thign ugh
      playerProduct: getters.GET_CHOSEN_CLIENT.product,
      machineIdentifier: getters.GET_ACTIVE_SERVER_ID,
    };
  },

  SYNC: async ({
    getters, dispatch, commit, rootGetters,
  }) => {
    if (getters.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10'
      && (!getters.GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID
        || getters.GET_PLEX_CLIENT_TIMELINE.commandID
          <= getters.GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID)) {
      // TODO: examine if I should throw error or handle it another way
      throw new Error('Already synced with this timeline. Need to wait for new one to sync again');
    }

    // TODO: make sure all them hit here and fix the id lol
    // todo: also store the command id above because it might have changed during the awaits
    // TODO: also update this when pausing or playign so we don't have werid stuff
    commit('SET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID', null);

    const adjustedHostTime = rootGetters['synclounge/GET_HOST_PLAYER_TIME_ADJUSTED']();

    // TODO: only do this if we are playign (but maybe we just did a play command>...)

    // TODO: see if i need await
    const playerPollData = dispatch('FETCH_TIMELINE_POLL_DATA_CACHE');

    // TODO: also assuming 0 rtt between us and player (is this wise)
    const timelineAge = playerPollData.recievedAt
      ? Date.now() - playerPollData.recievedAt
      : 0;

    const adjustedTime = playerPollData.playerState === 'playing'
      ? playerPollData + timelineAge
      : playerPollData.time;

    const difference = Math.abs(adjustedHostTime - adjustedTime);

    const bothPaused = rootGetters['synclounge/GET_HOST_TIMELINE'].playerState === 'paused'
       && playerPollData.playerState === 'paused';

    if (difference > rootGetters['settings/GET_SYNCFLEXIBILITY'] || (bothPaused && difference > 10)) {
      // We need to seek!
      // Decide what seeking method we want to use

      if (rootGetters['settings/GET_SYNCMODE'] === 'cleanseek'
        || rootGetters['synclounge/GET_HOST_TIMELINE'].playerState === 'paused') {
        return dispatch('SEEK_TO', adjustedHostTime);
      }

      return dispatch('SKIP_AHEAD', { offset: adjustedHostTime, duration: 10000 });
    }

    // TODO: come back and properly implement this

    // Calc the average delay of the last 10 host timeline updates
    // We do this to avoid any issues with random lag spikes
    // this.differenceCache.unshift(difference);
    // if (this.differenceCache.length > 5) {
    //   this.differenceCache.pop();
    // }

    // let total = 0;
    // for (let i = 0; i < this.differenceCache.length; i += 1) {
    //   total += this.differenceCache[i];
    // }

    // const avg = total / this.differenceCache.length;

    const avg = difference;
    if (getters.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10' && avg > 1500) {
      console.log('Soft syncing because difference is', difference);

      return dispatch('SOFT_SEEK', adjustedHostTime);
    }

    return 'No sync needed';
  },

  PRESS_PLAY: ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_PLAY', null, { root: true });
      }

      default: {
        return dispatch('SEND_CLIENT_REQUEST', {
          url: '/player/playback/play',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  PRESS_PAUSE: ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_PAUSE', null, { root: true });
      }

      default: {
        return dispatch('SEND_CLIENT_REQUEST', {
          url: '/player/playback/pause',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  PRESS_STOP: ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_STOP', null, { root: true });
      }

      default: {
        return dispatch('SEND_CLIENT_REQUEST', {
          url: '/player/playback/stop',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  SEEK_TO: ({ getters, dispatch }, offset) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/NORMAL_SEEK', offset, { root: true });
      }

      default: {
        return dispatch('SEND_CLIENT_REQUEST', {
          url: '/player/playback/seekTo',
          params: {
            wait: 0,
            offset,
          },
        });
      }
    }
  },

  WAIT_FOR_MOVEMENT: (startTime) => new Promise((resolve) => {
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
  }),

  SKIP_AHEAD: async (current, duration) => {
    const startedAt = Date.now();
    const now = this.lastTimelineObject.time;
    await this.seekTo(current + duration);
    await this.waitForMovement(now);
    // The client is now ready
    await this.pressPause();
    // Calculate how long it took to get to our ready state
    const elapsed = Date.now() - startedAt;
    await delay(duration - elapsed);
    await this.pressPlay();
  },

  SOFT_SEEK: ({ getters, dispatch }, offset) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/SOFT_SEEK', offset, { root: true });
      }

      default: {
        return dispatch('SEEK_TO', offset);
      }
    }
  },
};
