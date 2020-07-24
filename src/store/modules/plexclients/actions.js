import delay from '@/utils/delay';
import promiseutils from '@/utils/promiseutils';
import contentTitleUtils from '@/utils/contenttitleutils';
import cancelablePeriodicTask from '@/utils/cancelableperiodictask';
import { fetchXmlAndTransform } from '@/utils/fetchutils';

export default {
  FIND_AND_SET_CONNECTION: async ({ dispatch, commit }, { clientIdentifier, signal }) => {
    const chosenConnection = await dispatch('FIND_CONNECTION', { clientIdentifier, signal });
    commit('SET_CLIENT_CHOSEN_CONNECTION', { clientIdentifier, chosenConnection });
  },

  FIND_CONNECTION: ({ getters, dispatch }, { clientIdentifier, signal }) => {
    // This function iterates through all available connections and
    // if any of them return a valid response we'll set that connection
    // as the chosen connection for future use.

    if (clientIdentifier === 'PTPLAYER9PLUS10') {
      return true;
    }

    // Test request has to be a timeline request since some clients don't properly set cors headers
    const { connections, accessToken } = getters.GET_PLEX_CLIENT(clientIdentifier);

    return dispatch('FIND_WORKING_CONNECTION', {
      clientIdentifier, connections, accessToken, signal,
    });
  },

  FIND_WORKING_CONNECTION: async ({ dispatch }, {
    // TODO: come back and fix this
    // eslint-disable-next-line no-unused-vars
    connections, accessToken, clientIdentifier, signal,
  }) => {
    // TODO: figure out how to combine these two signals and abort requests when either fires
    const controller = new AbortController();
    const workingConnection = await promiseutils.any(
      connections.map((connection) => dispatch(
        'TEST_PLEX_CLIENT_CONNECTION',
        {
          connection, accessToken, clientIdentifier, signal: controller.signal,
        },
      )),
    );

    // Abort other connection attempts since we found one
    controller.abort();

    return workingConnection;
  },

  TEST_PLEX_CLIENT_CONNECTION: async ({ dispatch }, { connection, ...rest }) => {
    await dispatch('SEND_CLIENT_REQUEST_WITH_URI', {
      path: '/player/timeline/poll',
      params: {
        wait: 0,
      },
      uri: connection.uri,
      ...rest,
    });

    return connection;
  },

  PLAY_MEDIA: async ({
    getters, commit, dispatch, rootGetters,
  }, {
      mediaIndex, offset, metadata, machineIdentifier,
    }) => {
    console.log('play media');
    const server = rootGetters['plexservers/GET_PLEX_SERVER'](machineIdentifier);

    commit('SET_ACTIVE_PLAY_QUEUE', await dispatch('plexservers/CREATE_PLAY_QUEUE', {
      machineIdentifier,
      ratingKey: metadata.ratingKey,
    }, { root: true }));

    commit('SET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER', machineIdentifier);

    if (getters.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10') {
      commit('SET_ACTIVE_MEDIA_METADATA', metadata);
      commit('SET_ACTIVE_SERVER_ID', machineIdentifier);
      commit('plexservers/SET_LAST_SERVER_ID', machineIdentifier, { root: true });
      commit('slplayer/SET_MEDIA_INDEX', mediaIndex, { root: true });
      commit('slplayer/SET_OFFSET_MS', Math.round(offset) || 0, { root: true });
      commit('slplayer/SET_PLAYER_STATE', 'buffering', { root: true });
      commit('slplayer/SET_MASK_PLAYER_STATE', true, { root: true });
      await dispatch('synclounge/PROCESS_MEDIA_UPDATE', null, { root: true });

      if (rootGetters['slplayer/IS_PLAYER_INITIALIZED']) {
        await dispatch('slplayer/CHANGE_PLAYER_SRC', true, { root: true });
      } else {
        await dispatch('slplayer/NAVIGATE_AND_INITIALIZE_PLAYER', null, { root: true });
      }
    } else {
      // Play a media item given a mediaId key and a server to play from
      // We need the following variables to build our paramaters:
      // MediaId Key, Offset, server MachineId,
      // Server Ip, Server Port, Server Protocol, Path

      // TODO: potentially wait for stuff..

      // Plex remote control API says:
      // "After sending PlayMedia, the controller ignores timelines older than the last PlayMedia commandID."
      const commandId = getters.GET_COMMAND_ID;

      await dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
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
          containerKey: `/playQueues/${getters.GET_ACTIVE_PLAY_QUEUE.playQueueID}`,
          ...mediaIndex && { mediaIndex },
        },
      });

      commit('SET_LAST_PLAY_MEDIA_COMMAND_ID', commandId);

      // TODO: fix wait for movement lol
      // await this.waitForMovement();
    }
  },

  RESERVE_COMMAND_ID: ({ getters, commit }) => {
    const id = getters.GET_COMMAND_ID;
    commit('INCREMENT_COMMAND_ID');
    return id;
  },

  SEND_CLIENT_REQUEST_WITH_URI: async ({ dispatch, rootGetters }, {
    clientIdentifier, accessToken, uri, path, params, signal,
  }) => {
    const commandID = await dispatch('RESERVE_COMMAND_ID');

    return fetchXmlAndTransform(
      `${uri}${path}`,
      {
        commandID,
        type: 'video',
        ...params,
      },
      {
        headers: {
          ...rootGetters['plex/GET_PLEX_BASE_PARAMS'](accessToken),
          'X-Plex-Target-Client-Identifier': clientIdentifier,
        },
        signal,
      },
    );
  },

  SEND_CLIENT_REQUEST: ({ dispatch, getters }, { clientIdentifier, ...rest }) => {
    const { accessToken, chosenConnection: { uri } } = getters.GET_PLEX_CLIENT(clientIdentifier);
    return dispatch('SEND_CLIENT_REQUEST_WITH_URI', {
      accessToken, uri, clientIdentifier, ...rest,
    });
  },

  SEND_CHOSEN_CLIENT_REQUEST: ({ dispatch, getters }, args) => dispatch('SEND_CLIENT_REQUEST', {
    clientIdentifier: getters.GET_CHOSEN_CLIENT_ID,
    ...args,
  }),

  FETCH_CHOSEN_CLIENT_TIMELINE: async ({ dispatch }) => {
    const startedAt = Date.now();
    const data = await dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
      path: '/player/timeline/poll',
      params: {
        wait: 0,
      },
    });

    // Measure time it takes and adjust playback time if playing
    const latency = (Date.now() - startedAt) / 2;

    const videoTimeline = data.MediaContainer[0].Timeline.find((timeline) => timeline.type === 'video');

    // Clients seem to respond with strings instead of numbers so need to parse
    const time = parseInt(videoTimeline.time, 10);
    return {
      ...videoTimeline,
      time: videoTimeline.state === 'playing'
        ? time + latency
        : time,
      duration: parseInt(videoTimeline.duration, 10),
      updatedAt: Date.now(),
      playQueueItemID: parseInt(videoTimeline.playQueueItemID, 10),
      commandID: parseInt(data.MediaContainer[0].commandID, 10),
    };
  },

  UPDATE_PLEX_CLIENT_TIMELINE: async ({
    getters, rootGetters, dispatch, commit,
  }, timeline) => {
    if (!getters.GET_PLEX_CLIENT_TIMELINE
      || getters.GET_PLEX_CLIENT_TIMELINE.machineIdentifier !== timeline.machineIdentifier
      || !getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM
      || getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM.playQueueItemID !== timeline.playQueueItemID) {
      // If we are playing something different

      if (timeline.state === 'stopped') {
        commit('SET_ACTIVE_MEDIA_METADATA', null);
        commit('SET_ACTIVE_SERVER_ID', null);
        // Leaving play queue around for possible upnext
      } else {
        commit('SET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER', timeline.machineIdentifier);
        commit('SET_ACTIVE_PLAY_QUEUE', await dispatch('plexservers/FETCH_PLAY_QUEUE', {
          machineIdentifier: getters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER,
          playQueueID: timeline.playQueueID,
        }, { root: true }));

        await dispatch('UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');

        const serverName = rootGetters['plexservers/GET_PLEX_SERVER'](getters.GET_ACTIVE_SERVER_ID).name;
        await dispatch('DISPLAY_NOTIFICATION',
          `Now Playing: ${contentTitleUtils.getCombinedTitle(getters.GET_ACTIVE_MEDIA_METADATA)} from ${serverName}`,
          { root: true });
      }

      // Media changed
      commit('SET_PLEX_CLIENT_TIMELINE', timeline);
      if (rootGetters['synclounge/IS_IN_ROOM']) {
        await dispatch('synclounge/PROCESS_MEDIA_UPDATE', null, { root: true });
      }
    } else if (getters.GET_PLEX_CLIENT_TIMELINE.state !== timeline.state
      || getters.GET_PLEX_CLIENT_TIMELINE.duration !== timeline.duration
      || Math.abs(getters.GET_ADJUSTED_PLEX_CLIENT_POLL_DATA().time - timeline.time)
        > rootGetters.GET_CONFIG.plex_client_time_delta_state_change_threshold) {
      // If we had a player state change
      commit('SET_PLEX_CLIENT_TIMELINE', timeline);

      await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', null, { root: true });
    }
  },

  POLL_PLEX_CLIENT: async ({ getters, dispatch, commit }) => {
    // Saving it because making client request increments it
    // TODO: can I actually save it or is it reactive ahaha D:
    let currentCommandId = getters.GET_COMMAND_ID;
    try {
      const timeline = await dispatch('FETCH_CHOSEN_CLIENT_TIMELINE');

      if (getters.GET_LAST_PLAY_MEDIA_COMMAND_ID != null
        && timeline.commandID < getters.GET_LAST_PLAY_MEDIA_COMMAND_ID) {
      // Plex remote control api says:
      // "After sending PlayMedia, the controller ignores timelines older than the last PlayMedia commandID."
        return;
      }

      if (timeline.commandID > getters.GET_COMMAND_ID) {
      // If the client has a higher command ID, bump our id up to that
        currentCommandId = timeline.commandID;
        commit('SET_COMMAND_ID', timeline.commandID + 1);
      }

      commit('SET_PLEX_CLIENT_TIMELINE_COMMAND_ID', currentCommandId);

      await dispatch('UPDATE_PLEX_CLIENT_TIMELINE', timeline);
    } catch (e) {
      console.error('Failed fetching client timeline: ', e);
    }
  },

  // Same return as FETCH_TIMELINE_POLL_DATA but usees the cached data (if normal plex client rather than making a request)
  // or asks slplayer since it can do that with no delay
  FETCH_TIMELINE_POLL_DATA_CACHE: ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/FETCH_TIMELINE_POLL_DATA', null, { root: true });
      }

      default: {
        return getters.GET_ADJUSTED_PLEX_CLIENT_POLL_DATA();
      }
    }
  },

  FETCH_TIMELINE_POLL_DATA: async ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/FETCH_TIMELINE_POLL_DATA', null, { root: true });
      }

      default: {
        await dispatch('POLL_PLEX_CLIENT');
        return getters.GET_ADJUSTED_PLEX_CLIENT_POLL_DATA();
      }
    }
  },

  FETCH_JOIN_PLAYER_DATA: async ({ getters, dispatch }) => ({
    ...await dispatch('FETCH_TIMELINE_POLL_DATA'),
    media: getters.GET_ACTIVE_MEDIA_POLL_METADATA,
    playerProduct: getters.GET_CHOSEN_CLIENT.product,
  }),

  UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID: ({ commit, getters }) => {
    // TODO: make sure all them hit here and fix the id lol
    // todo: also store the command id above because it might have changed during the awaits
    // TODO: also update this when pausing or playign so we don't have werid stuff
    if (getters.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10') {
      commit('SET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID', getters.GET_PLEX_CLIENT_TIMELINE_COMMAND_ID);
    }
  },

  SYNC: async ({ getters, dispatch, rootGetters }, cancelSignal) => {
    await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');

    const adjustedHostTime = rootGetters['synclounge/GET_ADJUSTED_HOST_TIME']();

    // TODO: only do this if we are playign (but maybe we just did a play command>...)

    // I already adjust the time by age
    const playerPollData = await dispatch('FETCH_TIMELINE_POLL_DATA_CACHE');

    const difference = Math.abs(adjustedHostTime - playerPollData.time);

    const bothPaused = rootGetters['synclounge/GET_HOST_USER'].state === 'paused'
      && playerPollData.state === 'paused';

    console.log('difference: ', difference);
    if (difference > rootGetters['settings/GET_SYNCFLEXIBILITY'] || (bothPaused && difference > 10)) {
      // We need to seek!
      // Decide what seeking method we want to use

      if (rootGetters['settings/GET_SYNCMODE'] === 'cleanseek'
        || rootGetters['synclounge/GET_HOST_USER'].state === 'paused') {
        return dispatch('SEEK_TO', { cancelSignal, offset: adjustedHostTime });
      }

      // TODO: add cancel
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
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_PLAY', null, { root: true });
      }

      default: {
        await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');
        return dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
          path: '/player/playback/play',
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
        return dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
          path: '/player/playback/pause',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  PRESS_STOP: async ({ getters, dispatch }) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/PRESS_STOP', null, { root: true });
      }

      default: {
        await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');

        return dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
          path: '/player/playback/stop',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  SEEK_TO: async ({ getters, dispatch }, { cancelSignal, offset }) => {
    console.log('Seek to');
    // TODO: adjust time by latency if playing
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        return dispatch('slplayer/SPEED_OR_NORMAL_SEEK', { cancelSignal, seekToMs: offset }, { root: true });
      }

      default: {
        await dispatch('UPDATE_PREVIOUS_SYNC_TIMELINE_COMMAND_ID');

        return dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
          cancelSignal,
          path: '/player/playback/seekTo',
          params: {
            wait: 0,
            offset: Math.round(offset),
          },
        });
      }
    }
  },

  WAIT_FOR_MOVEMENT: ({ dispatch }, startTime) => new Promise((resolve) => {
    // TODO: fix this
    let time = 500;
    if (this.clientIdentifier === 'PTPLAYER9PLUS10') {
      time = 50;
    }
    const timer = setInterval(async () => {
      const timeline = await dispatch('POLL_CLIENT');
      if (timeline.time !== startTime) {
        console.log('Player has movement!');
        resolve();

        clearInterval(timer);
      }
    }, time);
  }),

  SKIP_AHEAD: async ({ getters, dispatch }, { current, duration }) => {
    // TODO: lol this is broken fix pls
    const startedAt = Date.now();
    const now = getters.GET_PLEX_CLIENT_TIMELINE.time;
    // TODO: CUSTOM SLPLAYER UGH
    await dispatch('SEEK_TO', current + duration);
    await dispatch('WAIT_FOR_MOVEMENT', now);

    // The client is now ready
    await dispatch('PRESS_PAUSE');

    // Calculate how long it took to get to our ready state
    const elapsed = Date.now() - startedAt;
    await delay(duration - elapsed);

    await dispatch('PRESS_PLAY');
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

  UPDATE_ACTIVE_PLAY_QUEUE: async ({ getters, dispatch, commit }) => {
    commit('SET_ACTIVE_PLAY_QUEUE', await dispatch('plexservers/FETCH_PLAY_QUEUE', {
      machineIdentifier: getters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER,
      playQueueID: getters.GET_ACTIVE_PLAY_QUEUE.playQueueID,
    }, { root: true }));
  },

  UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM: async ({ getters, dispatch, commit }) => {
    const metadata = await dispatch('FETCH_METADATA_OF_PLAY_QUEUE_ITEM', getters.GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM);
    if (!getters.GET_ACTIVE_MEDIA_METADATA
      || metadata.ratingKey !== getters.GET_ACTIVE_MEDIA_METADATA.ratingKey
      || getters.GET_ACTIVE_SERVER_ID !== metadata.machineIdentifier) {
      commit('SET_ACTIVE_SERVER_ID', metadata.machineIdentifier);
      commit('plexservers/SET_LAST_SERVER_ID', metadata.machineIdentifier, { root: true });
      commit('SET_ACTIVE_MEDIA_METADATA', metadata);
    }
  },

  FETCH_METADATA_OF_PLAY_QUEUE_ITEM: ({ getters, dispatch }, playQueueItem) => {
    if (playQueueItem.source) {
      // If source is defined on selected item, then it is on a different server and we need to do more stuff.
      // Source looks likes: "server://{MACHINE_IDENTIFIER}/com.plexapp.plugins.library"
      const regex = /^server:\/\/(\w+)\//;
      const machineIdentifier = playQueueItem.source.match(regex)[1];

      return dispatch('plexservers/FETCH_PLEX_METADATA', {
        machineIdentifier,
        ratingKey: playQueueItem.ratingKey,
      }, { root: true });
    }

    return {
      machineIdentifier: getters.GET_ACTIVE_PLAY_QUEUE_MACHINE_IDENTIFIER,
      ...playQueueItem,
    };
  },

  PLAY_NEXT: ({ getters, rootGetters, dispatch }, metadata) => {
    switch (getters.GET_CHOSEN_CLIENT_ID) {
      case 'PTPLAYER9PLUS10': {
        if (rootGetters['slplayer/IS_PLAYER_INITIALIZED']) {
          return dispatch('slplayer/PLAY_NEXT', null, { root: true });
        }

        const { viewOffset: offset, machineIdentifier } = metadata;
        return dispatch('PLAY_MEDIA', {
          mediaIndex: 0,
          offset,
          machineIdentifier,
          metadata,
        });
      }

      default: {
        return dispatch('SEND_CHOSEN_CLIENT_REQUEST', {
          path: '/player/playback/skipNext',
          params: {
            wait: 0,
          },
        });
      }
    }
  },

  START_CLIENT_POLLER_IF_NEEDED: ({
    getters, commit, dispatch, rootGetters,
  }) => {
    if (getters.GET_CHOSEN_CLIENT_ID !== 'PTPLAYER9PLUS10' && !getters.GET_CLIENT_POLLER_CANCELER) {
      commit('SET_CLIENT_POLLER_CANCELER', cancelablePeriodicTask(
        () => dispatch('POLL_PLEX_CLIENT'),
        () => rootGetters['settings/GET_CLIENTPOLLINTERVAL'],
      ));
    }
  },

  CANCEL_CLIENT_POLLER_IF_NEEDED: ({ getters, commit }) => {
    if (getters.GET_CLIENT_POLLER_CANCELER) {
      getters.GET_CLIENT_POLLER_CANCELER();
      commit('SET_CLIENT_POLLER_CANCELER', null);
    }
  },
};
