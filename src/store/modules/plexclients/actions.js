import router from '@/router';
import promiseutils from '@/utils/promiseutils';
import xmlutils from '@/utils/xmlutils';
import delay from '@/utils/delay';
import contentTitleUtils from '@/utils/contenttitleutils';

export default {
  FIND_AND_SET_CONNECTION: async ({ dispatch, commit }, clientIdentifier) => {
    const chosenConnection = await dispatch('FIND_CONNECTION', clientIdentifier);
    commit('SET_CLIENT_CHOSEN_CONNECTION', { clientIdentifier, chosenConnection });
  },

  FIND_CONNECTION: ({ getters, dispatch }, clientIdentifier) => {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.

    if (clientIdentifier === 'PTPLAYER9PLUS10') {
      return true;
    }

    const client = getters.GET_PLEX_CLIENT(clientIdentifier);

    return promiseutils.any(
      client.connections.map((connection) => dispatch(
        'TEST_CONNECTION',
        { connection, accessToken: client.accessToken },
      ).then(() => connection)),
    );
  },

  // Using fetch here so I can use the 'no-cors' mode
  TEST_CONNECTION: ({ rootGetters }, { connection, accessToken }) => fetch(
    `${connection.uri}/resources?${new URLSearchParams(
      rootGetters['plex/GET_PLEX_BASE_PARAMS'](accessToken),
    )}`, {
      mode: 'no-cors',
    },
  ),

  PLAY_MEDIA: async ({
    getters, commit, dispatch, rootGetters,
  }, {
      mediaIndex, offset, metadata, machineIdentifier,
    }) => {
    const server = rootGetters['plexservers/GET_PLEX_SERVER'](machineIdentifier);

    if (getters.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10') {
      // do raw stuff
      // commit the proper stuff

      commit('SET_ACTIVE_MEDIA_METADATA', metadata);
      commit('SET_ACTIVE_SERVER_ID', machineIdentifier);
      commit('plexservers/SET_LAST_SERVER_ID', machineIdentifier, { root: true });
      commit('slplayer/SET_MEDIA_INDEX', mediaIndex, { root: true });
      commit('slplayer/SET_OFFSET_MS', Math.round(offset) || 0, { root: true });

      if (router.currentRoute.name === 'player') {
        await dispatch('slplayer/CHANGE_PLAYER_SRC', null, { root: true });
      } else {
        // TODO: fix this is so hacky
        commit('slplayer/SET_PLAYER_STATE', 'buffering', { root: true });
        router.push('/player');
      }

      // TODO: navigate there lol
    } else {
      // Play a media item given a mediaId key and a server to play from
      // We need the following variables to build our paramaters:
      // MediaId Key, Offset, server MachineId,
      // Server Ip, Server Port, Server Protocol, Path

      await dispatch('plexservers/CREATE_PLAY_QUEUE', {
        machineIdentifier,
        ratingKey: metadata.ratingKey,
      }, { root: true });

      // TODO: potentially wait for stuff..

      await dispatch('SEND_CLIENT_REQUEST', {
        path: '/player/playback/playMedia',
        params: {
          wait: 0,
          key: metadata.key,
          offset: Math.round(offset) || 0,
          machineIdentifier,
          address: server.chosenConnection.address,
          port: server.chosenConnection.port,
          protocol: server.chosenConnection.protocol,
          path: server.chosenConnection.uri + metadata.key,
          token: server.accessToken,
          containerKey: `/playQueues/${rootGetters['plexservers/GET_PLAY_QUEUE_ID']}`,
          ...mediaIndex && { mediaIndex },
        },
      });

      // TODO: fix wait for movement lol
      // await this.waitForMovement();
    }
  },

  SEND_CLIENT_REQUEST: async ({ getters, commit }, { path, params }) => {
    const { data } = await getters.GET_CHOSEN_PLEX_CLIENT_AXIOS.get(path, {
      params: {
        commandID: getters.GET_COMMAND_ID,
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
      path: '/player/timeline/poll',
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

  UPDATE_PLEX_CLIENT_TIMELINE: async ({
    getters, rootGetters, dispatch, commit,
  }, timeline) => {
    if (!getters.GET_PLEX_CLIENT_TIMELINE
      || getters.GET_PLEX_CLIENT_TIMELINE.machineIdentifier !== timeline.machineIdentifier
      || getters.GET_PLEX_CLIENT_TIMELINE.ratingKey !== timeline.ratingKey) {
      if (timeline.state === 'stopped') {
        commit('SET_ACTIVE_MEDIA_METADATA', null);
        commit('SET_ACTIVE_SERVER_ID', null);
      } else {
        // If client has changed what it's playing
        // TODO: see what client sends when its stopped and set metadata and stuff to null instead if so
        const metadata = await dispatch('plexservers/FETCH_PLEX_METADATA', {
          machineIdentifier: timeline.machineIdentifier,
          ratingKey: timeline.ratingKey,
        }, { root: true });

        commit('SET_ACTIVE_MEDIA_METADATA', metadata);

        commit('SET_ACTIVE_SERVER_ID', timeline.machineIdentifier);
        commit('plexservers/SET_LAST_SERVER_ID', timeline.machineIdentifier, { root: true });

        const serverName = rootGetters['plexservers/GET_PLEX_SERVER'](timeline.machineIdentifier).name;
        dispatch('DISPLAY_NOTIFICATION',
          `Now Playing: ${contentTitleUtils.getCombinedTitle(metadata)} from ${serverName}`,
          { root: true });
      }
    }

    commit('SET_PLEX_CLIENT_TIMELINE', timeline);
    // TODO: do whatever was in the new timeline event handler here
  },

  POLL_PLEX_CLIENT: async ({ getters, dispatch, commit }) => {
    commit('SET_PLEX_CLIENT_TIMELINE_COMMAND_ID', getters.GET_COMMAND_ID);

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
    await dispatch('HANDLE_NEW_TIMELINE', timelinePart);

    return {
      ...getters.GET_ACTIVE_MEDIA_POLL_METADATA,
      ...timelinePart,

      // TODO: fix up roduct below thign ugh
      playerProduct: getters.GET_CHOSEN_CLIENT.product,
      machineIdentifier: getters.GET_ACTIVE_SERVER_ID,
    };
  },

  HANDLE_NEW_TIMELINE: async ({
    commit, getters, rootGetters, dispatch,
  }, timeline) => {
    // Check if we need to activate the upnext feature
    if (rootGetters['synclounge/AM_I_HOST']) {
      if (timeline.playerState !== 'stopped' && timeline.duration && timeline.time
        && (timeline.duration - timeline.time) < 10000
        && getters.GET_ACTIVE_MEDIA_METADATA.type === 'episode'
      ) {
        if (!getters.GET_UP_NEXT_TRIGGERED) {
          const item = await dispatch('plexservers/FETCH_POST_PLAY', {
            machineIdentifier: getters.GET_ACTIVE_SERVER_ID,
            ratingKey: getters.GET_ACTIVE_MEDIA_METADATA.ratingKey,
          }, { root: true });

          if (item.grandparentRatingKey
            === getters.GET_ACTIVE_MEDIA_METADATA.grandparentRatingKey) {
            commit('SET_UP_NEXT_POST_PLAY_DATA', item, { root: true });
          }

          commit('SET_UP_NEXT_TRIGGERED', true, { root: true });
        }
      } else if (getters.GET_UP_NEXT_TRIGGERED) {
        // If outside upnext period, reset triggered
        commit('SET_UP_NEXT_TRIGGERED', false, { root: true });
      }
    }

    return true;
  },

  UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID: ({ commit, getters }) => {
    // TODO: make sure all them hit here and fix the id lol
    // todo: also store the command id above because it might have changed during the awaits
    // TODO: also update this when pausing or playign so we don't have werid stuff
    if (getters.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10') {
      commit('SET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID', getters.GET_PLEX_CLIENT_TIMELINE_COMMAND_ID);
    }
  },

  SYNC: async ({ getters, dispatch, rootGetters }) => {
    await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');

    const adjustedHostTime = rootGetters['synclounge/GET_HOST_PLAYER_TIME_ADJUSTED']();

    // TODO: only do this if we are playign (but maybe we just did a play command>...)

    // TODO: see if i need await
    const playerPollData = await dispatch('FETCH_TIMELINE_POLL_DATA_CACHE');

    // TODO: also assuming 0 rtt between us and player (is this wise)
    const timelineAge = playerPollData.recievedAt
      ? Date.now() - playerPollData.recievedAt
      : 0;

    const adjustedTime = playerPollData.playerState === 'playing'
      ? playerPollData.time + timelineAge
      : playerPollData.time;

    const difference = Math.abs(adjustedHostTime - adjustedTime);

    const bothPaused = rootGetters['synclounge/GET_HOST_TIMELINE'].playerState === 'paused'
      && playerPollData.playerState === 'paused';

    console.log('difference: ', difference);
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

  PRESS_PLAY: async ({ getters, dispatch }) => {
    console.log('Press play');
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_PLAY', null, { root: true });
      }

      default: {
        await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');
        return dispatch('SEND_CLIENT_REQUEST', {
          path: '/player/playback/play',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  PRESS_PAUSE: ({ getters, dispatch }) => {
    console.log('Press play');
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_PAUSE', null, { root: true });
      }

      default: {
        return dispatch('SEND_CLIENT_REQUEST', {
          path: '/player/playback/pause',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  PRESS_STOP: async ({ getters, dispatch }) => {
    console.log('Press stop');
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_STOP', null, { root: true });
      }

      default: {
        await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');

        return dispatch('SEND_CLIENT_REQUEST', {
          path: '/player/playback/stop',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  SEEK_TO: async ({ getters, dispatch }, offset) => {
    console.log('Seek to');
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/NORMAL_SEEK', offset, { root: true });
      }

      default: {
        await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');

        return dispatch('SEND_CLIENT_REQUEST', {
          path: '/player/playback/seekTo',
          params: {
            wait: 0,
            offset,
          },
        });
      }
    }
  },

  WAIT_FOR_MOVEMENT: (startTime) => new Promise((resolve) => {
    // TODO: fix this
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
    // TODO: lol this is broken fix pls
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
    console.log('soft seek');
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
