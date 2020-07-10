import axios from 'axios';
import CAF from 'caf';
import guid from '@/utils/guid';
import eventhandlers from '@/store/modules/synclounge/eventhandlers';
import combineUrl from '@/utils/combineurl';
import {
  open, close, on, waitForEvent, isConnected, emit,
} from '@/socket';

export default {
  CONNECT_AND_JOIN_ROOM: async ({ getters, dispatch }) => {
    await dispatch('ESTABLISH_SOCKET_CONNECTION');
    await dispatch('JOIN_ROOM_AND_INIT');

    // Add this item to our recently-connected list
    await dispatch(
      'ADD_RECENT_ROOM',
      {
        server: getters.GET_SERVER,
        room: getters.GET_ROOM,
        password: getters.GET_PASSWORD,
        time: Date.now(),
      },
    );
  },

  SET_AND_CONNECT_AND_JOIN_ROOM: ({ commit, dispatch }, { server, room, password }) => {
    commit('SET_SERVER', server);
    commit('SET_ROOM', room);
    commit('SET_PASSWORD', password);
    return dispatch('CONNECT_AND_JOIN_ROOM');
  },

  ESTABLISH_SOCKET_CONNECTION: async ({ getters, dispatch }) => {
    // TODO: make wrapper method that disconnects the socket if it already exists
    if (isConnected()) {
      await dispatch('DISCONNECT');
    }

    const url = combineUrl('socket.io', getters.GET_SERVER);
    await open(url.origin, {
      path: url.pathname,
      transports: ['websocket', 'polling'],
    });

    // Wait for initial slPing
    // Doing it this way rather than adding the normal listener because there is no guarentee on the order
    // of event handlers so, if I did a one time listener for slping just to wait, that handler might be fired first,
    // which means it will do stuff before actually responding to the ping (which the normal handler does).
    // I am not very happy with this but I don't know of a easy better way atm. Maybe reactive streams in the future,
    // but that's a bit over my head now
    const secret = await waitForEvent('slPing');

    // Explicitly handling the slping because we haven't registered the events yet
    await dispatch('HANDLE_SLPING', secret);
    await dispatch('ADD_EVENT_HANDLERS');
  },

  JOIN_ROOM: async ({ getters, rootGetters, dispatch }) => {
    const joinPlayerData = await dispatch('plexclients/FETCH_JOIN_PLAYER_DATA', null, { root: true });

    emit({
      eventName: 'join',
      data: {
        // TODO: rename to roomId
        roomId: getters.GET_ROOM,
        password: getters.GET_PASSWORD,
        desiredUsername: getters.GET_DISPLAY_USERNAME,
        // TODO: add config optin for this
        desiredPartyPausingEnabled: true,
        thumb: rootGetters['plex/GET_PLEX_USER'].thumb,
        ...joinPlayerData,
      },
    });

    const { success, error, ...rest } = await waitForEvent('joinResult');
    if (!success) {
      throw new Error(error);
    }

    return rest;
  },

  JOIN_ROOM_AND_INIT: async ({
    getters, rootGetters, dispatch, commit,
  }) => {
    // Note: this is also called on rejoining, so be careful not to register handlers twice
    // or duplicate tasks
    const {
      user: { id, ...rest }, users, isPartyPausingEnabled, hostId,
    } = await dispatch('JOIN_ROOM');
    const updatedAt = Date.now();
    commit('SET_SOCKET_ID', id);
    commit('SET_HOST_ID', hostId);

    commit('SET_USERS', Object.fromEntries(
      Object.entries(users).map(([socketid, data]) => ([socketid, {
        ...data,
        updatedAt,
      }])),
    ));

    // Add ourselves to user list
    commit('SET_USER', {
      id,
      data: {
        ...rest,
        thumb: rootGetters['plex/GET_PLEX_USER'].thumb,
        media: rootGetters['plexclients/GET_ACTIVE_MEDIA_POLL_METADATA'],
        playerProduct: rootGetters['plexclients/GET_CHOSEN_CLIENT'].product,
        updatedAt,
        ...await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true }),
      },
    });

    commit('SET_IS_PARTY_PAUSING_ENABLED', isPartyPausingEnabled);
    commit('SET_IS_IN_ROOM', true);

    await dispatch('plexclients/START_CLIENT_POLLER_IF_NEEDED', null, { root: true });
    await dispatch('DISPLAY_NOTIFICATION', `Joined room: ${getters.GET_ROOM}`, { root: true });
    await dispatch('SYNC_MEDIA_AND_PLAYER_STATE');
  },

  DISCONNECT: async ({ commit, dispatch }) => {
    console.log('Decided we should disconnect from the SL Server.');

    // Cancel poller
    await dispatch('plexclients/CANCEL_CLIENT_POLLER_IF_NEEDED', null, { root: true });

    close();
    commit('SET_IS_IN_ROOM', false);
    commit('SET_USERS', {});
    commit('SET_HOST_ID', null);
    commit('CLEAR_MESSAGES');
    commit('SET_MESSAGES_USER_CACHE', {});
  },

  SEND_MESSAGE: async ({ dispatch, getters }, msg) => {
    await dispatch('ADD_MESSAGE_AND_CACHE', {
      senderId: getters.GET_SOCKET_ID,
      text: msg,
    });

    emit({
      eventName: 'sendMessage',
      data: msg,
    });
  },

  TRANSFER_HOST: (context, id) => {
    emit({
      eventName: 'transferHost',
      data: id,
    });
  },

  SEND_SET_PARTY_PAUSING_ENABLED: (context, value) => {
    emit({
      eventName: 'setPartyPausingEnabled',
      data: value,
    });
  },

  sendPartyPause: ({ getters }, isPause) => {
    if (!getters.AM_I_HOST && getters.IS_PARTY_PAUSING_ENABLED) {
      emit({
        eventName: 'partyPause',
        data: isPause,
      });
    }
  },

  FETCH_SERVERS_HEALTH: async ({ getters, commit }) => {
    const start = new Date().getTime();
    const results = await Promise.allSettled(getters.GET_SYNCLOUNGE_SERVERS
      .filter((server) => server.url !== 'custom')
      .map(async ({ url }) => ({
        ...(await axios.get(`${url}/health`, { timeout: 2000 }).data),
        latency: new Date().getTime() - start,
        url,
      })));

    const aliveServerHealths = results.filter((result) => result.status === 'fulfilled')
      .map(({ value }) => value);

    commit('SET_SERVERS_HEALTH', aliveServerHealths);
  },

  GET_OR_FETCH_SERVERS_HEALTH: async ({ dispatch, getters }) => {
    if (getters.GET_SERVERS_HEALTH) {
      return getters.GET_SERVERS_HEALTH;
    }

    await dispatch('FETCH_SERVERS_HEALTH');
    return getters.GET_SERVERS_HEALTH;
  },

  CREATE_AND_JOIN_ROOM: ({ getters, dispatch }) => dispatch('SET_AND_CONNECT_AND_JOIN_ROOM', {
    server: getters.GET_BEST_SERVER,
    room: guid(),
    password: null,
  }),

  ADD_RECENT_ROOM: ({ commit, getters }, newRoom) => commit(
    'SET_RECENT_ROOMS',
    Array.of(newRoom).concat(
      getters.GET_RECENT_ROOMS.filter(
        (room) => room.server !== newRoom.server || room.room !== newRoom.room,
      ),
    ),
  ),

  REMOVE_RECENT_ROOM: ({ commit, getters }, roomToRemove) => commit(
    'SET_RECENT_ROOMS',
    getters.GET_RECENT_ROOMS.filter(
      (room) => room.server !== roomToRemove.server || room.room !== roomToRemove.room,
    ),
  ),

  ADD_EVENT_HANDLERS: ({ dispatch }) => {
    const makeHandler = (action) => (data) => dispatch(action, data);

    const registerListener = ({ eventName, action }) => on({
      eventName,
      handler: makeHandler(action),
    });

    registerListener({ eventName: 'userJoined', action: 'HANDLE_USER_JOINED' });
    registerListener({ eventName: 'userLeft', action: 'HANDLE_USER_LEFT' });
    registerListener({ eventName: 'newHost', action: 'HANDLE_NEW_HOST' });
    registerListener({ eventName: 'newMesage', action: 'ADD_MESSAGE_AND_CACHE' });
    registerListener({ eventName: 'slPing', action: 'HANDLE_SLPING' });
    registerListener({ eventName: 'playerStateUpdate', action: 'HANDLE_PLAYER_STATE_UPDATE' });
    registerListener({ eventName: 'mediaUpdate', action: 'HANDLE_MEDIA_UPDATE' });
    registerListener({ eventName: 'setPartyPausingEnabled', action: 'HANDLE_SET_PARTY_PAUSING_ENABLED' });
    registerListener({ eventName: 'partyPause', action: 'HANDLE_PARTY_PAUSE' });
    registerListener({ eventName: 'disconnect', action: 'HANDLE_DISCONNECT' });
    registerListener({ eventName: 'connect', action: 'HANDLE_RECONNECT' });
  },

  FETCH_PLAYER_STATE: async ({ getters, dispatch }) => {
    const { time, ...rest } = await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true });
    return {
      ...rest,
      time,
      syncState: getters.GET_SYNC_STATE(time),
    };
  },

  PROCESS_PLAYER_STATE_UPDATE: async ({ getters, dispatch, commit }, noSync) => {
    // TODO: only send message if in room, check in room
    const playerState = await dispatch('FETCH_PLAYER_STATE');

    commit('SET_USER_PLAYER_STATE', {
      ...playerState,
      id: getters.GET_SOCKET_ID,
    });

    emit({
      eventName: 'playerStateUpdate',
      data: playerState,
    });

    if (playerState.state !== 'buffering' && !noSync) {
      await dispatch('SYNC_PLAYER_STATE');
    }
  },

  PROCESS_MEDIA_UPDATE: async ({
    dispatch, getters, commit, rootGetters,
  }) => {
    // TODO: only send message if in room, check in room
    const playerState = await dispatch('FETCH_PLAYER_STATE');

    commit('SET_USER_MEDIA', {
      id: getters.GET_SOCKET_ID,
      media: rootGetters['plexclients/GET_ACTIVE_MEDIA_POLL_METADATA'],
    });

    commit('SET_USER_PLAYER_STATE', {
      ...playerState,
      id: getters.GET_SOCKET_ID,
    });

    emit({
      eventName: 'mediaUpdate',
      data: {
        media: rootGetters['plexclients/GET_ACTIVE_MEDIA_POLL_METADATA'],
        ...playerState,
      },
    });

    await dispatch('SYNC_PLAYER_STATE');
  },

  ADD_MESSAGE_AND_CACHE: ({ getters, commit }, msg) => {
    if (!getters.GET_MESSAGES_USER_CACHE_USER(msg.senderId)) {
      // Cache user details so we can still display user avatar and username after user leaves
      const { username, thumb } = getters.GET_USER(msg.senderId);

      commit('SET_MESSAGES_USER_CACHE_USER', {
        id: msg.senderId,
        data: {
          username, thumb,
        },
      });
    }

    commit('ADD_MESSAGE', {
      ...msg,
      time: Date.now(),
    });
  },

  MANUAL_SYNC: async ({ getters, dispatch, commit }) => {
    console.log('manual sync');
    if (getters.GET_SYNC_CANCEL_TOKEN) {
      // If sync in progress, cancel it
      getters.GET_SYNC_CANCEL_TOKEN.abort('Aborted for manual sync');
      commit('SET_SYNC_CANCEL_TOKEN', null);
    }

    // eslint-disable-next-line new-cap
    commit('SET_SYNC_CANCEL_TOKEN', new CAF.cancelToken());
    try {
      await dispatch('plexclients/SEEK_TO', {
        cancelSignal: null,
        offest: getters.GET_ADJUSTED_HOST_TIME(),
      }, { root: true });
    } catch (e) {
      console.log('Error caught in sync logic', e);
    }

    commit('SET_SYNC_CANCEL_TOKEN', null);
  },

  SYNC_MEDIA_AND_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    if (getters.AM_I_HOST) {
      return;
    }

    /* This is data from the host, we should react to this data by potentially changing
        what we're playing or seeking to get back in sync with the host.

        We need to limit how ourself to make sure we dont hit the client too hard.
        We'll only fetch new data if our data is older than 1000ms.
        If we need to fetch new data, we'll do that and then decide
        if we need to seek or start playing something.
      */

    if (!getters.GET_SYNC_CANCEL_TOKEN) {
      // Basically a lock that only allows 1 sync at a time (TODO: PLEASE PLEASE IMPLEMENT CANCELLING TOOOOO)
      // eslint-disable-next-line new-cap
      commit('SET_SYNC_CANCEL_TOKEN', new CAF.cancelToken());

      try {
        await dispatch('_SYNC_MEDIA_AND_PLAYER_STATE', getters.GET_SYNC_CANCEL_TOKEN.signal);
      } catch (e) {
        console.log('Error caught in sync logic', e);
      }

      commit('SET_SYNC_CANCEL_TOKEN', null);
    }
  },

  // Interal action without lock. Use the one with the lock to stop multiple syncs from happening at once
  _SYNC_MEDIA_AND_PLAYER_STATE: async ({ getters, dispatch, rootGetters }, cancelSignal) => {
    console.log('_SYNC_MEDIA_AND_PLAYER_STATE');
    // TODO: potentailly don't do anythign if we have no timeline data yet
    const timeline = await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true });

    if (rootGetters['plexclients/ALREADY_SYNCED_ON_CURRENT_TIMELINE']) {
    // TODO: examine if I should throw error or handle it another way
      console.log(rootGetters['plexclients/GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID']);
      throw new Error('Already synced with this timeline. Need to wait for new one to sync again');
    }

    if (getters.GET_HOST_USER.state === 'stopped') {
      // First, decide if we should stop playback
      if (timeline.state !== 'stopped') {
        await dispatch('DISPLAY_NOTIFICATION', 'The host pressed stop', { root: true });
        await dispatch('plexclients/PRESS_STOP', null, { root: true });
        return;
      }

      return;
    }

    // Logic for deciding whether we should play somethign different
    if (rootGetters['settings/GET_AUTOPLAY']) {
      const bestMatch = await dispatch('plexservers/FIND_BEST_MEDIA_MATCH', getters.GET_HOST_USER.media, { root: true });
      if (bestMatch) {
        if (!rootGetters['plexclients/IS_THIS_MEDIA_PLAYING'](bestMatch)) {
          // If we aren't playing the best match, play it
          await dispatch('PLAY_MEDIA_AND_SYNC_TIME', bestMatch);
          return;
        }
        // TODO: fix
      } else {
        await dispatch('DISPLAY_NOTIFICATION',
          `Failed to find a compatible copy of ${getters.GET_HOST_USER.media.title}. If you have access to the content try manually playing it.`,
          { root: true });
      }
    }

    await dispatch('_SYNC_PLAYER_STATE', cancelSignal);
  },

  SYNC_PLAYER_STATE: async ({ dispatch, getters, commit }) => {
    if (getters.AM_I_HOST) {
      return;
    }

    if (!getters.GET_SYNC_CANCEL_TOKEN) {
      // Basically a lock that only allows 1 sync at a time (TODO: PLEASE PLEASE IMPLEMENT CANCELLING TOOOOO)
      // eslint-disable-next-line new-cap
      commit('SET_SYNC_CANCEL_TOKEN', new CAF.cancelToken());

      try {
        await dispatch('_SYNC_PLAYER_STATE', getters.GET_SYNC_CANCEL_TOKEN.signal);
      } catch (e) {
        console.log('Error caught in sync logic', e);
      }

      commit('SET_SYNC_CANCEL_TOKEN', null);
    }
  },

  // Private version without lock. Please use the locking version unless you know what you are doing
  _SYNC_PLAYER_STATE: async ({ getters, dispatch }, cancelSignal) => {
    console.log('_SYNC_PLAYER_STATE');
    const timeline = await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true });

    // TODO: examine if we want this or not
    if (timeline.state === 'buffering') {
      return;
    }

    // If we didn't find a good match or .... wtf??
    if (timeline.state === 'stopped') {
      return;
    }

    if (getters.GET_HOST_USER.state === 'playing' && timeline.state === 'paused') {
      await dispatch('DISPLAY_NOTIFICATION', 'Resuming..', { root: true });
      await dispatch('plexclients/PRESS_PLAY', null, { root: true });
      return;
    }

    if ((getters.GET_HOST_USER.state === 'paused'
          || getters.GET_HOST_USER.state === 'buffering')
          && timeline.state === 'playing') {
      await dispatch('DISPLAY_NOTIFICATION', 'Pausing..', { root: true });
      await dispatch('plexclients/PRESS_PAUSE', null, { root: true });
      return;
    }

    // TODO: potentially update the player state if we paused or played so we know in the sync
    await dispatch('plexclients/SYNC', cancelSignal, { root: true });
    console.log('done sync');
  },

  PLAY_MEDIA_AND_SYNC_TIME: async ({ getters, dispatch }, media) => {
    await dispatch('plexclients/PLAY_MEDIA', {
      mediaIndex: media.mediaIndex || 0,
      // TODO: potentially play ahead a bit by the time it takes to buffer / transcode. (figure out how to calculate that)
      offset: getters.GET_HOST_USER.time || 0,
      metadata: media,
      machineIdentifier: media.machineIdentifier,
    }, { root: true });
  },

  ...eventhandlers,
};
