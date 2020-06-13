import router from '@/router';
import promiseutils from '@/utils/promiseutils';

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

  PLEX_CLIENT_PLAY_MEDIA: async ({ getters, commit }, {
    key, mediaIndex, serverIdentifier, offset,
  }) => {
    const server = getters.GET_PLEX_SERVER(serverIdentifier);

    if (getters.GET_CHOSEN_CLIENT_ID === 'PTPLAYER9PLUS10') {
      // do raw stuff
      // commit the proper stuff
      commit('slplayer/SET_PLEX_SERVER_ID', serverIdentifier);
      commit('slplayer/SET_KEY', key);
      commit('slplayer/SET_MEDIA_INDEX', mediaIndex);
      commit('slplayer/SET_OFFSET_MS', Math.round(offset) || 0);
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

};