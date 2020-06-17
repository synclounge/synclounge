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
      commit('slplayer/SET_METADATA', metadata, { root: true });
      commit('slplayer/SET_PLEX_SERVER_ID', serverIdentifier, { root: true });
      commit('slplayer/SET_KEY', key, { root: true });
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

  FETCH_CHOSEN_CLIENT_TIMELINE: async ({ getters }) => {
    const { data } = await getters.GET_CHOSEN_PLEX_CLIENT_AXIOS.get('/player/timeline/poll', {
      params: {
        wait: 0,
      },
      transformResponse: xmlutils.parseXML,
    });

    const videoTimeline = data.MediaContainer[0].Timeline.find((timeline) => timeline.type === 'video');

    return {
      ...videoTimeline,
      time: parseInt(videoTimeline.time, 10),
      duration: parseInt(videoTimeline.duration, 10),
      receivedAt: Date.now(),
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

    return {
      time: getters.GET_PLEX_CLIENT_TIMELINE.time,
      duration: getters.GET_PLEX_CLIENT_TIMELINE.duration,
      playerState: getters.GET_PLEX_CLIENT_TIMELINE.state,
    };
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

    return {
      ...getters.GET_ACTIVE_MEDIA_POLL_METADATA,
      ...timelinePart,

      // TODO: fix up roduct below thign ugh
      playerProduct: getters.GET_CHOSEN_CLIENT.product,
      machineIdentifier: getters.GET_ACTIVE_SERVER_ID,
    };
  },
};
