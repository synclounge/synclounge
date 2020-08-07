import { emit, waitForEvent, getId } from '@/socket';

export default {
  HANDLE_SET_PARTY_PAUSING_ENABLED: async ({ getters, dispatch, commit }, value) => {
    await dispatch('ADD_MESSAGE_AND_CACHE_AND_NOTIFY', {
      senderId: getters.GET_HOST_ID,
      text: `Party Pausing has been turned ${value ? 'on' : 'off'}`,
    });

    commit('SET_IS_PARTY_PAUSING_ENABLED', value);
  },

  HANDLE_USER_JOINED: async ({ commit, dispatch }, { id, ...rest }) => {
    commit('SET_USER', {
      id,
      data: {
        ...rest,
        updatedAt: Date.now(),
      },
    });

    await dispatch('ADD_MESSAGE_AND_CACHE_AND_NOTIFY', {
      senderId: id,
      text: `${rest.username} joined`,
    });
  },

  HANDLE_USER_LEFT: async ({ getters, dispatch, commit }, { id, newHostId }) => {
    await dispatch('ADD_MESSAGE_AND_CACHE_AND_NOTIFY', {
      senderId: id,
      text: `${getters.GET_USER(id).username} left the room`,
    });

    if (newHostId) {
      await dispatch('HANDLE_NEW_HOST', newHostId);
    }

    commit('DELETE_USER', id);
  },

  HANDLE_NEW_HOST: async ({ getters, dispatch, commit }, hostId) => {
    commit('SET_HOST_ID', hostId);
    await dispatch('ADD_MESSAGE_AND_CACHE_AND_NOTIFY', {
      senderId: hostId,
      text: `${getters.GET_USER(hostId).username} is now the host`,
    });

    await dispatch('CANCEL_IN_PROGRESS_SYNC');
    await dispatch('SYNC_MEDIA_AND_PLAYER_STATE');
  },

  HANDLE_DISCONNECT: async ({ dispatch }) => {
    console.log('disconnect');
    await dispatch('DISPLAY_NOTIFICATION',
      'Disconnected from the SyncLounge server', { root: true });
  },

  HANDLE_RECONNECT: async ({ dispatch, commit }) => {
    console.log('Rejoining');
    await waitForEvent('slPing');
    commit('SET_SOCKET_ID', getId());
    await dispatch('JOIN_ROOM_AND_INIT');
    // TODO: EXAMINE THIS AND FIGURE OUT HOW TO SYNC
  },

  HANDLE_SLPING: async (context, secret) => {
    emit({
      eventName: 'slPong',
      data: secret,
    });
  },

  HANDLE_PLAYER_STATE_UPDATE: async ({ getters, dispatch, commit }, data) => {
    commit('SET_USER_PLAYER_STATE', data);

    if (data.id === getters.GET_HOST_ID) {
      await dispatch('CANCEL_IN_PROGRESS_SYNC');
      await dispatch('SYNC_PLAYER_STATE');
    }
  },

  HANDLE_MEDIA_UPDATE: async ({
    getters, dispatch, commit,
  }, {
      id, state, time, duration, media, makeHost,
    }) => {
    commit('SET_USER_PLAYER_STATE', {
      id,
      state,
      time,
      duration,
    });

    commit('SET_USER_MEDIA', {
      id,
      media,
    });

    if (makeHost) {
      await dispatch('HANDLE_NEW_HOST', id);
      return;
    }

    if (id === getters.GET_HOST_ID) {
      await dispatch('CANCEL_IN_PROGRESS_SYNC');
      await dispatch('SYNC_MEDIA_AND_PLAYER_STATE');
    }
  },

  HANDLE_SYNC_FLEXIBILITY_UPDATE: ({ commit }, data) => {
    commit('SET_USER_SYNC_FLEXIBILITY', data);
  },

  HANDLE_PARTY_PAUSE: async ({ getters, dispatch }, { senderId, isPause }) => {
    // TODO: maybe stop it from looking at host after party pausing until host also updates or acks
    // that it got the party pause ?
    const text = `${getters.GET_USER(senderId).username} pressed ${isPause ? 'pause' : 'play'}`;
    await dispatch('ADD_MESSAGE_AND_CACHE_AND_NOTIFY', {
      senderId,
      text,
    });

    await dispatch('DISPLAY_NOTIFICATION', text, { root: true });

    if (isPause) {
      await dispatch('plexclients/PRESS_PAUSE', null, { root: true });
    } else {
      await dispatch('plexclients/PRESS_PLAY', null, { root: true });
    }
  },
};
