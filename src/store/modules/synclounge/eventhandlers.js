export default {
  HANDLE_POLL_RESULT: ({ commit, getters }, { users, commandId }) => {
    // Now we need to setup events for dealing with the PTServer.
    // We will regularly be recieving and sending data to and from the server.
    // We want to make sure we are listening for all the server events

    commit('UPDATE_SRTT', Date.now() - getters.GET_POLL_SENT_TIME(commandId));
    commit('DELETE_UNACKED_POLL', commandId);
    commit('SET_USERS', users);
  },

  HANDLE_PARTY_PAUSING_CHANGED: ({ commit }, { value, user }) => {
    commit('ADD_MESSAGE', {
      msg: `Party Pausing has been turned ${value ? 'on' : 'off'}`,
      user,
      type: 'alert',
    });

    commit('SET_PARTYPAUSING', value);
  },

  HANDLE_PARTY_PAUSING_PAUSE: async ({ commit, dispatch }, { isPause, user }) => {
    const messageText = `${user.username} pressed ${isPause ? 'pause' : 'play'}`;
    commit('ADD_MESSAGE', {
      msg: messageText,
      user,
      type: 'alert',
    });

    await dispatch('DISPLAY_NOTIFICATION', messageText, { root: true });

    if (isPause) {
      await dispatch('plexclients/PRESS_PAUSE', null, { root: true });
    } else {
      await dispatch('plexclients/PRESS_PLAY', null, { root: true });
    }
  },

  HANDLE_USER_JOINED: ({ commit }, { users, user }) => {
    commit('SET_USERS', users);
    commit('ADD_MESSAGE', {
      msg: `${user.username} joined`,
      user,
      type: 'alert',
    });
  },

  HANDLE_USER_LEFT: ({ commit }, { users, user }) => {
    commit('SET_USERS', users);
    commit('ADD_MESSAGE', {
      msg: `${user.username} left the room`,
      user,
      type: 'alert',
    });
  },

  HANDLE_HOST_SWAP: ({ commit }, user) => {
    if (!user) {
      return;
    }

    commit('ADD_MESSAGE', {
      msg: `${user.username} is now the host`,
      user,
      type: 'alert',
    });
  },

  HANDLE_HOST_UPDATE: ({ getters, commit, dispatch }, timeline) => {
    if (!getters.GET_HOST_TIMELINE
        || getters.GET_HOST_TIMELINE.state !== timeline.state
        || Math.abs(timeline.time - getters.GET_HOST_TIMELINE.time) < 5000) {
      window.EventBus.$emit('host-playerstate-change');
    }

    commit('SET_HOST_TIMELINE', {
      ...timeline,
      receivedAt: Date.now(),
      srttSnapsnotAtReception: getters.GET_SRTT,
    });

    return dispatch('SYNCHRONIZE');
  },

  SYNCHRONIZE: async ({ getters, commit, dispatch }) => {
    await dispatch('plex/FETCH_PLEX_DEVICES_IF_NEEDED', null, { root: true });
    /* This is data from the host, we should react to this data by potentially changing
        what we're playing or seeking to get back in sync with the host.

        We need to limit how ourself to make sure we dont hit the client too hard.
        We'll only fetch new data if our data is older than 1000ms.
        If we need to fetch new data, we'll do that and then decide
        if we need to seek or start playing something.
      */

    // TODO: move this manual sync into this module
    if (getters.IS_MANUAL_SYNC_QUEUED) {
      // TODO: find a way to remove this event
      window.EventBus.$emit('host-playerstate-change');
      await dispatch('plexclients/SEEK_TO', getters.GET_HOST_TIMELINE.time, { root: true });
      commit('SET_MANUAL_SYNC_QUEUED', false, { root: true });
      return;
    }

    if (!getters.IS_SYNC_IN_PROGRESS) {
      // Basically a lock that only allows 1 sync at a time
      commit('SET_IS_SYNC_IN_PROGRESS', true);

      try {
        await dispatch('DECISION_MAKER');
      } catch (e) {
        console.log('Error caught in sync logic', e);
      }

      commit('SET_IS_SYNC_IN_PROGRESS', false);
    }
  },

  DECISION_MAKER: async ({
    getters, dispatch, rootGetters, commit,
  }) => {
    // TODO: potentailly don't do anythign if we have no timeline data yet
    const timeline = await dispatch('plexclients/FETCH_TIMELINE_POLL_DATA_CACHE', null, { root: true });

    if (rootGetters['plexclients/ALREADY_SYNCED_ON_CURRENT_TIMELINE']) {
    // TODO: examine if I should throw error or handle it another way
      console.log(rootGetters['plexclients/GET_PREVIOUS_SYNC_TIMELINE_COMMAND_ID']);
      throw new Error('Already synced with this timeline. Need to wait for new one to sync again');
    }

    if (getters.GET_HOST_TIMELINE.state === 'stopped') {
      // First, decide if we should stop playback
      if (timeline.state !== 'stopped') {
        await dispatch('DISPLAY_NOTIFICATION', 'The host pressed stop', { root: true });
        return dispatch('plexclients/PRESS_STOP', null, { root: true });
      }

      return true;
    }

    if (rootGetters['settings/GET_AUTOPLAY']
    && getters.GET_HOST_TIMELINE.ratingKey !== getters.GET_HOST_LAST_RATING_KEY) {
      // If we have autoplay enabled and the host rating key has changed or if we aren't playign anything
      console.log('Autoplaying because host changed ratingKey from: ', getters.GET_HOST_LAST_RATING_KEY, 'to', getters.GET_HOST_TIMELINE.ratingKey);
      commit('SET_HOST_LAST_RATING_KEY', getters.GET_HOST_TIMELINE.ratingKey);
      return dispatch('FIND_AND_PLAY_NEW_MEDIA');
    }

    // TODO: examine if we want this or not
    if (timeline.state === 'buffering') {
      return false;
    }

    // If we didn't find a good match or .... wtf??
    if (timeline.state === 'stopped') {
      return false;
    }

    if (getters.GET_HOST_TIMELINE.state === 'playing' && timeline.state === 'paused') {
      await dispatch('DISPLAY_NOTIFICATION', 'Resuming..', { root: true });
      return dispatch('plexclients/PRESS_PLAY', null, { root: true });
    }

    if ((getters.GET_HOST_TIMELINE.state === 'paused'
          || getters.GET_HOST_TIMELINE.state === 'buffering')
          && timeline.state === 'playing') {
      await dispatch('DISPLAY_NOTIFICATION', 'Pausing..', { root: true });
      return dispatch('plexclients/PRESS_PAUSE', null, { root: true });
    }

    // TODO: since we have awaited,

    // TODO: potentially update the player state if we paused or played so we know in the sync
    return dispatch('plexclients/SYNC', null, { root: true });
  },

  FIND_AND_PLAY_NEW_MEDIA: async ({ getters, dispatch }) => {
    await dispatch('DISPLAY_NOTIFICATION', `Searching Plex Servers for "${getters.GET_HOST_TIMELINE.rawTitle}"`, { root: true });

    const bestMatch = await dispatch('plexservers/FIND_BEST_MEDIA_MATCH', getters.GET_HOST_TIMELINE, { root: true });

    if (bestMatch) {
      await dispatch('plexclients/PLAY_MEDIA', {
        // TODO: have timeline updates send out more info like mediaIdentifier etc
        mediaIndex: bestMatch.mediaIndex || 0,
        offset: getters.GET_HOST_TIMELINE.time || 0,
        metadata: bestMatch,
        machineIdentifier: bestMatch.machineIdentifier,
      }, { root: true });
    } else {
      await dispatch('DISPLAY_NOTIFICATION',
        `Failed to find a compatible copy of ${getters.GET_HOST_TIMELINE.title}. If you have access to the content try manually playing it.`,
        { root: true });
    }
  },

  HANDLE_DISCONNECT: async ({ dispatch }) => {
    await dispatch('DISPLAY_NOTIFICATION', 'Disconnected from the SyncLounge server', { root: true });
  },

  HANDLE_RECONNECT: ({ dispatch }) => {
    console.log('Rejoining');
    return dispatch('JOIN_ROOM_AND_INIT');
  },
};
