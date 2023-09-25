import { CAF } from 'caf';
import eventhandlers from '@/store/modules/synclounge/eventhandlers';
import { combineUrl, combineRelativeUrlParts } from '@/utils/combineurl';
import { fetchJson } from '@/utils/fetchutils';
import { slPlayerClientId } from '@/player/constants';
import {
  open, close, on, waitForEvent, isConnected, emit,
} from '@/socket';
import notificationSound from '@/assets/sounds/notification_simple-01.wav';

const notificationAudio = new Audio(notificationSound);

export default {
  CONNECT_AND_JOIN_ROOM: async ({ dispatch }) => {
    await dispatch('ESTABLISH_SOCKET_CONNECTION');
    await dispatch('JOIN_ROOM_AND_INIT');
  },

  SET_AND_CONNECT_AND_JOIN_ROOM: ({ commit, dispatch }, { server, room }) => {
    commit('SET_SERVER', server);
    commit('SET_ROOM', room);
    return dispatch('CONNECT_AND_JOIN_ROOM');
  },

  DISCONNECT_IF_CONNECTED: async ({ dispatch }) => {
    if (isConnected()) {
      await dispatch('DISCONNECT');
    }
  },

  ESTABLISH_SOCKET_CONNECTION: async ({ getters, commit, dispatch }) => {
    await dispatch('DISCONNECT_IF_CONNECTED');

    const currentUrl = new URL(window.location.pathname, window.location.origin);
    const properBase = new URL(getters.GET_SERVER, currentUrl.toString());

    const url = combineUrl('socket.io', properBase.toString());
    console.log('ESTABLISH_SOCKET_CONNECTION', url.toString());

    const { id } = await open(url.origin, {
      path: url.pathname,
      transports: ['websocket', 'polling'],
    });

    commit('SET_SOCKET_ID', id);

    // Wait for initial slPing
    // Doing it this way rather than adding the normal listener because there is no guarentee on
    // the order of event handlers so, if I did a one time listener for slping just to wait, that
    // handler might be fired first, which means it will do stuff before actually responding to the
    // ping(which the normal handler does). I am not very happy with this but I don't know of a easy
    // better way atm. Maybe reactive streams in the future, but that's a bit over my head now
    const secret = await waitForEvent('slPing');

    // Explicitly handling the slping because we haven't registered the events yet
    await dispatch('HANDLE_SLPING', secret);
    await dispatch('ADD_EVENT_HANDLERS');
  },

  JOIN_ROOM: async ({ getters, rootGetters, dispatch }) => {
    const joinPlayerData = await dispatch(
      'plexclients/FETCH_JOIN_PLAYER_DATA',
      null,
      { root: true },
    );

    emit({
      eventName: 'join',
      data: {
        roomId: getters.GET_ROOM,
        desiredUsername: getters.GET_DISPLAY_USERNAME,
        desiredPartyPausingEnabled: getters.IS_PARTY_PAUSING_ENABLED,
        desiredAutoHostEnabled: getters.IS_AUTO_HOST_ENABLED,
        thumb: rootGetters['plex/GET_PLEX_USER'].thumb,
        syncFlexibility: rootGetters['settings/GET_SYNCFLEXIBILITY'],
        ...joinPlayerData,
      },
    });

    const { success, error, ...rest } = await waitForEvent('joinResult');
    if (!success) {
      throw new Error(error);
    }

    return rest;
  },

  JOIN_ROOM_AND_INIT: async ({ rootGetters, dispatch, commit }) => {
    // Note: this is also called on rejoining, so be careful not to register handlers twice
    // or duplicate tasks
    const {
      user: { id, ...rest }, users, isPartyPausingEnabled, isAutoHostEnabled, hostId,
    } = await dispatch('JOIN_ROOM');
    const updatedAt = Date.now();

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
        syncFlexibility: rootGetters['settings/GET_SYNCFLEXIBILITY'],
        updatedAt,
        ...await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true }),
      },
    });

    commit('SET_IS_PARTY_PAUSING_ENABLED', isPartyPausingEnabled);
    commit('SET_IS_AUTO_HOST_ENABLED', isAutoHostEnabled);
    commit('SET_IS_IN_ROOM', true);

    // Purposefully not awaited
    dispatch('plexclients/START_CLIENT_POLLER_IF_NEEDED', null, { root: true });
    await dispatch('DISPLAY_NOTIFICATION', {
      text: 'Joined room',
      color: 'success',
    }, { root: true });
    await dispatch('SYNC_MEDIA_AND_PLAYER_STATE');
  },

  DISCONNECT: async ({ commit, dispatch }) => {
    // Cancel poller
    await dispatch('plexclients/CANCEL_CLIENT_POLLER_IF_NEEDED', null, { root: true });

    close();
    commit('SET_IS_IN_ROOM', false);
    commit('SET_USERS', {});
    commit('SET_HOST_ID', null);
    commit('SET_SERVER', null);
    commit('SET_ROOM', null);
    commit('SET_SOCKET_ID', null);
    commit('CLEAR_MESSAGES');
    commit('SET_MESSAGES_USER_CACHE', {});
    commit('SET_IS_PARTY_PAUSING_ENABLED', null);
    commit('SET_IS_AUTO_HOST_ENABLED', null);
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

  SEND_SET_AUTO_HOST_ENABLED: (context, value) => {
    emit({
      eventName: 'setAutoHostEnabled',
      data: value,
    });
  },

  sendPartyPause: ({ getters, rootGetters }, isPause) => {
    if ((!getters.AM_I_HOST
      || rootGetters['plexclients/GET_CHOSEN_CLIENT_ID'] !== slPlayerClientId)
      && getters.IS_PARTY_PAUSING_ENABLED) {
      emit({
        eventName: 'partyPause',
        data: isPause,
      });
    }
  },

  FETCH_SERVERS_HEALTH: async ({ rootGetters, commit }) => {
    const start = Date.now();
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, rootGetters.GET_CONFIG.socket_server_health_timeout);

    const results = await Promise.allSettled(
      rootGetters.GET_CONFIG.servers.map(async ({ url }) => [
        url,
        {
          ...await fetchJson(
            combineRelativeUrlParts(url, 'health'),
            null,
            { signal: controller.signal },
          ),
          latency: Date.now() - start,
        },
      ]),
    );

    clearTimeout(timeout);

    const aliveServerHealths = Object.fromEntries(
      results.filter((result) => result.status === 'fulfilled')
        .map(({ value }) => value),
    );

    commit('SET_SERVERS_HEALTH', aliveServerHealths);
  },

  ADD_EVENT_HANDLERS: ({ dispatch }) => {
    const makeHandler = (action) => (data) => dispatch(action, data);

    const registerListener = ({ eventName, action }) => on({
      eventName,
      handler: makeHandler(action),
    });

    registerListener({ eventName: 'userJoined', action: 'HANDLE_USER_JOINED' });
    registerListener({ eventName: 'userLeft', action: 'HANDLE_USER_LEFT' });
    registerListener({ eventName: 'newHost', action: 'HANDLE_NEW_HOST' });
    registerListener({ eventName: 'newMessage', action: 'ADD_MESSAGE_AND_CACHE_AND_NOTIFY' });
    registerListener({ eventName: 'slPing', action: 'HANDLE_SLPING' });
    registerListener({ eventName: 'playerStateUpdate', action: 'HANDLE_PLAYER_STATE_UPDATE' });
    registerListener({ eventName: 'mediaUpdate', action: 'HANDLE_MEDIA_UPDATE' });
    registerListener({
      eventName: 'syncFlexibilityUpdate',
      action: 'HANDLE_SYNC_FLEXIBILITY_UPDATE',
    });
    registerListener({
      eventName: 'setPartyPausingEnabled',
      action: 'HANDLE_SET_PARTY_PAUSING_ENABLED',
    });

    registerListener({
      eventName: 'setAutoHostEnabled',
      action: 'HANDLE_SET_AUTO_HOST_ENABLED',
    });
    registerListener({ eventName: 'partyPause', action: 'HANDLE_PARTY_PAUSE' });
    registerListener({ eventName: 'disconnect', action: 'HANDLE_DISCONNECT' });
    registerListener({ eventName: 'connect', action: 'HANDLE_RECONNECT' });
    registerListener({ eventName: 'kicked', action: 'HANDLE_KICKED' });
  },

  CANCEL_UPNEXT: ({ getters, commit }) => {
    if (getters.GET_UPNEXT_TIMEOUT_ID != null) {
      clearTimeout(getters.GET_UPNEXT_TIMEOUT_ID);
      commit('SET_UPNEXT_TIMEOUT_ID', null);
    }
  },

  DISPLAY_UPNEXT: async ({ rootGetters, dispatch, commit }) => {
    console.debug('DISPLAY_UPNEXT');
    if (rootGetters['plexclients/ACTIVE_PLAY_QUEUE_NEXT_ITEM_EXISTS']) {
      commit(
        'SET_UP_NEXT_POST_PLAY_DATA',
        await dispatch(
          'plexclients/FETCH_METADATA_OF_PLAY_QUEUE_ITEM',
          rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE'].Metadata[
            rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE'].playQueueSelectedItemOffset + 1],
          { root: true },
        ),
        { root: true },
      );
    }

    commit('SET_UP_NEXT_TRIGGERED', true);
  },

  SCHEDULE_UPNEXT: async ({ rootGetters, dispatch, commit }, playerState) => {
    if (playerState.duration && !Number.isNaN(playerState.time)) {
      const timeUntilUpnextTrigger = playerState.duration - playerState.time
        - rootGetters.GET_CONFIG.synclounge_upnext_trigger_time_from_end;

      console.debug('SCHEDULE_UPNEXT', timeUntilUpnextTrigger);
      commit('SET_UPNEXT_TIMEOUT_ID', setTimeout(
        () => dispatch('DISPLAY_UPNEXT'),
        timeUntilUpnextTrigger,
      ));
    }
  },

  CALC_IS_IN_UPNEXT_REGION: async ({ rootGetters }, playerState) => playerState.duration
    && playerState.time
      && (playerState.duration - playerState.time)
        < rootGetters.GET_CONFIG.synclounge_upnext_trigger_time_from_end,

  PROCESS_UPNEXT: async ({
    getters, rootGetters, dispatch, commit,
  }, playerState) => {
    // Cancel any timers because the state has changed and previous is now invalid
    await dispatch('CANCEL_UPNEXT');

    // Check if we need to activate the upnext feature
    if (getters.AM_I_HOST && playerState.state !== 'stopped'
      && !rootGetters.GET_UP_NEXT_POST_PLAY_DATA) {
      // If in region and not already scheduled
      if (await dispatch('CALC_IS_IN_UPNEXT_REGION', playerState)) {
        if (!getters.GET_UP_NEXT_TRIGGERED) {
          // Display upnext immediately
          await dispatch('DISPLAY_UPNEXT');
        }
      } else if (playerState.state === 'playing') {
        await dispatch('SCHEDULE_UPNEXT', playerState);
      }

      commit('SET_UP_NEXT_TRIGGERED', false);
    } else if (getters.GET_UP_NEXT_TRIGGERED) {
      commit('SET_UP_NEXT_TRIGGERED', false);
    }
  },

  PROCESS_PLAYER_STATE_UPDATE: async ({ getters, dispatch, commit }, noSync) => {
    // TODO: only send message if in room, check in room
    const playerState = await dispatch(
      'plexclients/FETCH_TIMELINE_POLL_DATA_CACHE',
      null,
      { root: true },
    );

    commit('SET_USER_PLAYER_STATE', {
      ...playerState,
      id: getters.GET_SOCKET_ID,
    });

    emit({
      eventName: 'playerStateUpdate',
      data: playerState,
    });

    await dispatch('PROCESS_UPNEXT', playerState);

    if (playerState.state !== 'buffering' && !noSync) {
      await dispatch('SYNC_PLAYER_STATE');
    }
  },

  PROCESS_MEDIA_UPDATE: async ({
    dispatch, getters, commit, rootGetters,
  }, userInitiated) => {
    // TODO: only send message if in room, check in room
    const playerState = await dispatch(
      'plexclients/FETCH_TIMELINE_POLL_DATA_CACHE',
      null,
      { root: true },
    );

    if (playerState.state !== 'stopped') {
      if (rootGetters.GET_UP_NEXT_POST_PLAY_DATA) {
        commit('SET_UP_NEXT_POST_PLAY_DATA', null, { root: true });
      }
    }

    if (getters.GET_UP_NEXT_TRIGGERED) {
      commit('SET_UP_NEXT_TRIGGERED', false);
    }

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
        userInitiated,
      },
    });

    await dispatch('PROCESS_UPNEXT', playerState);

    if (!userInitiated) {
      await dispatch('SYNC_PLAYER_STATE');
    }
  },

  ADD_MESSAGE_AND_CACHE_AND_NOTIFY: async ({ getters, dispatch }, msg) => {
    await dispatch('ADD_MESSAGE_AND_CACHE', msg);

    if (getters.ARE_SOUND_NOTIFICATIONS_ENABLED) {
      notificationAudio.play();
    }

    if (getters.ARE_NOTIFICATIONS_ENABLED) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return;
        }
      }

      const { username, thumb } = getters.GET_MESSAGES_USER_CACHE_USER(msg.senderId);

      // TODO: notifications don't work when on http. Maybe make alternative popup thing?
      // eslint-disable-next-line no-new
      new Notification(username, {
        body: msg.text,
        icon: thumb,
      });
    }
  },

  ADD_MESSAGE_AND_CACHE: ({ getters, commit }, msg) => {
    const { username, thumb } = getters.GET_USER(msg.senderId);
    if (!getters.GET_MESSAGES_USER_CACHE_USER(msg.senderId)) {
      // Cache user details so we can still display user avatar and username after user leaves

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

  CANCEL_IN_PROGRESS_SYNC: ({ getters, commit }) => {
    // TODO: if the slplayer is currently being initialized, wait for that to finish
    if (!getters.GET_SYNC_CANCEL_TOKEN) {
      return;
    }

    // If sync in progress, cancel it
    getters.GET_SYNC_CANCEL_TOKEN.abort('Sync cancelled');
    console.log('sync cancelled');
    commit('SET_SYNC_CANCEL_TOKEN', null);
  },

  MANUAL_SYNC: async ({
    getters, rootGetters, dispatch, commit,
  }) => {
    console.debug('MANUAL_SYNC');
    await dispatch('CANCEL_IN_PROGRESS_SYNC');

    const adjustedHostTime = getters.GET_ADJUSTED_HOST_TIME();
    // Adjust seek time by the time it takes to send a request to the client
    const offset = rootGetters['plexclients/GET_CHOSEN_CLIENT_ID'] !== slPlayerClientId
        && getters.GET_HOST_USER.state === 'playing'
      ? adjustedHostTime + rootGetters['plexclients/GET_LATENCY']
      : adjustedHostTime;

    // eslint-disable-next-line new-cap
    const token = new CAF.cancelToken();
    commit('SET_SYNC_CANCEL_TOKEN', token);
    try {
      await dispatch('plexclients/SEEK_TO', {
        cancelSignal: token.signal,
        offset,
      }, { root: true });
    } catch (e) {
      console.warn('Error caught in sync logic', e);
    }

    commit('SET_SYNC_CANCEL_TOKEN', null);
  },

  SYNC_MEDIA_AND_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    if (getters.AM_I_HOST || getters.GET_SYNC_CANCEL_TOKEN) {
      return;
    }

    /* This is data from the host, we should react to this data by potentially changing
        what we're playing or seeking to get back in sync with the host.

        We need to limit how ourself to make sure we dont hit the client too hard.
        We'll only fetch new data if our data is older than 1000ms.
        If we need to fetch new data, we'll do that and then decide
        if we need to seek or start playing something.
      */

    // eslint-disable-next-line new-cap
    const token = new CAF.cancelToken();
    commit('SET_SYNC_CANCEL_TOKEN', token);

    try {
      await dispatch('_SYNC_MEDIA_AND_PLAYER_STATE', token.signal);
    } catch (e) {
      console.log('Error caught in sync logic', e);
    }

    commit('SET_SYNC_CANCEL_TOKEN', null);
  },

  // Interal action without lock. Use the one with the lock to stop multiple syncs from happening
  // at once
  _SYNC_MEDIA_AND_PLAYER_STATE: async ({ getters, dispatch, rootGetters }, cancelSignal) => {
    console.debug('_SYNC_MEDIA_AND_PLAYER_STATE');
    // TODO: potentailly don't do anythign if we have no timeline data yet
    const timeline = await dispatch(
      'plexclients/FETCH_TIMELINE_POLL_DATA_CACHE',
      null,
      { root: true },
    );

    if (rootGetters['plexclients/ALREADY_SYNCED_ON_CURRENT_TIMELINE']) {
    // TODO: examine if I should throw error or handle it another way
      throw new Error('Already synced with this timeline. Need to wait for new one to sync again');
    }

    if (getters.GET_HOST_USER.state === 'stopped') {
      // First, decide if we should stop playback
      if (timeline.state !== 'stopped') {
        await dispatch('DISPLAY_NOTIFICATION', {
          text: 'The host pressed stop',
          color: 'info',
        }, { root: true });
        await dispatch('plexclients/PRESS_STOP', null, { root: true });
        return;
      }

      return;
    }

    // Logic for deciding whether we should play somethign different
    if (rootGetters['settings/GET_AUTOPLAY']) {
      const bestMatch = await dispatch(
        'plexservers/FIND_BEST_MEDIA_MATCH',
        getters.GET_HOST_USER.media,
        { root: true },
      );
      if (bestMatch) {
        if (!rootGetters['plexclients/IS_THIS_MEDIA_PLAYING'](bestMatch)) {
          // If we aren't playing the best match, play it
          await dispatch('PLAY_MEDIA_AND_SYNC_TIME', bestMatch);
          return;
        }
        // TODO: fix
      } else {
        const text = `Failed to find a compatible copy of ${getters.GET_HOST_USER.media.title
        }. If you have access to the content try manually playing it.`;
        console.warn(text);
        await dispatch('DISPLAY_NOTIFICATION', {
          text,
          color: 'error',
        }, { root: true });
      }
    }

    await dispatch('_SYNC_PLAYER_STATE', cancelSignal);
  },

  SYNC_PLAYER_STATE: async ({ dispatch, getters, commit }) => {
    if (getters.AM_I_HOST || getters.GET_SYNC_CANCEL_TOKEN) {
      return;
    }

    // eslint-disable-next-line new-cap
    const token = new CAF.cancelToken();
    commit('SET_SYNC_CANCEL_TOKEN', token);

    try {
      await dispatch('_SYNC_PLAYER_STATE', token.signal);
    } catch (e) {
      console.log('Error caught in sync logic', e);
    }

    commit('SET_SYNC_CANCEL_TOKEN', null);
  },

  // Private version without lock. Please use the locking version unless you know what you are doing
  _SYNC_PLAYER_STATE: async ({ getters, dispatch }, cancelSignal) => {
    console.debug('_SYNC_PLAYER_STATE');
    const timeline = await dispatch(
      'plexclients/FETCH_TIMELINE_POLL_DATA_CACHE',
      null,
      { root: true },
    );

    // TODO: examine if we want this or not
    if (timeline.state === 'buffering') {
      return;
    }

    // If we didn't find a good match or .... wtf??
    if (timeline.state === 'stopped') {
      return;
    }

    if (getters.GET_HOST_USER.state === 'playing' && timeline.state === 'paused') {
      await dispatch('DISPLAY_NOTIFICATION', {
        text: 'Resuming..',
        color: 'info',
      }, { root: true });
      await dispatch('plexclients/PRESS_PLAY', cancelSignal, { root: true });
      return;
    }

    if ((getters.GET_HOST_USER.state === 'paused'
          || getters.GET_HOST_USER.state === 'buffering')
          && timeline.state === 'playing') {
      await dispatch('DISPLAY_NOTIFICATION', {
        text: 'Pausing..',
        color: 'info',
      }, { root: true });
      await dispatch('plexclients/PRESS_PAUSE', cancelSignal, { root: true });
      return;
    }

    // TODO: potentially update the player state if we paused or played so we know in the sync
    await dispatch('plexclients/SYNC', cancelSignal, { root: true });
    console.log('done sync');
  },

  PLAY_MEDIA_AND_SYNC_TIME: async ({ getters, rootGetters, dispatch }, media) => {
    const adjustedHostTime = getters.GET_ADJUSTED_HOST_TIME();
    // Adjust seek time by the time it takes to send a request to the client
    const offset = rootGetters['plexclients/GET_CHOSEN_CLIENT_ID'] !== slPlayerClientId
        && getters.GET_HOST_USER.state === 'playing'
      ? adjustedHostTime + rootGetters['plexclients/GET_LATENCY']
      : adjustedHostTime;

    await dispatch('plexclients/PLAY_MEDIA', {
      mediaIndex: media.mediaIndex || 0,
      // TODO: potentially play ahead a bit by the time it takes to buffer / transcode.
      offset: offset || 0,
      metadata: media,
      machineIdentifier: media.machineIdentifier,
    }, { root: true });
  },

  REQUEST_ALLOW_NOTIFICATIONS: async ({ commit }) => {
    const permission = await Notification.requestPermission();
    commit('SET_ARE_NOTIFICATIONS_ENABLED', permission === 'granted');
  },

  CHANGE_NOTIFICATIONS_ENABLED: async ({ commit, dispatch }, enabled) => {
    if (enabled) {
      if (Notification.permission === 'granted') {
        commit('SET_ARE_NOTIFICATIONS_ENABLED', true);
      } else {
        await dispatch('REQUEST_ALLOW_NOTIFICATIONS');
      }
    } else {
      commit('SET_ARE_NOTIFICATIONS_ENABLED', false);
    }
  },

  SEND_SYNC_FLEXIBILITY_UPDATE: ({ rootGetters }) => {
    emit({
      eventName: 'syncFlexibilityUpdate',
      data: rootGetters['settings/GET_SYNCFLEXIBILITY'],
    });
  },

  UPDATE_SYNC_FLEXIBILITY: async ({ getters, dispatch, commit }, syncFlexibility) => {
    commit('settings/SET_SYNCFLEXIBILITY', syncFlexibility, { root: true });

    if (getters.IS_IN_ROOM) {
      commit('SET_USER_SYNC_FLEXIBILITY', {
        id: getters.GET_SOCKET_ID,
        syncFlexibility,
      });

      await dispatch('SEND_SYNC_FLEXIBILITY_UPDATE');
    }
  },

  KICK_USER: (ctx, id) => {
    console.log('KICK_USER', id);
    emit({
      eventName: 'kick',
      data: id,
    });
  },

  DISCONNECT_AND_NAVIGATE_HOME: async ({ dispatch }) => {
    await dispatch('DISCONNECT');
    await dispatch('NAVIGATE_HOME', null, { root: true });
  },

  ...eventhandlers,
};
