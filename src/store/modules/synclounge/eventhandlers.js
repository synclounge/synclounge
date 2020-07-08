import { emit } from '@/socket';

export default {
  HANDLE_SET_PARTY_PAUSING_ENABLED: async ({ getters, dispatch, commit }, value) => {
    await dispatch('ADD_MESSAGE_AND_CACHE', {
      senderId: getters.GET_HOST_ID,
      text: `Party Pausing has been turned ${value ? 'on' : 'off'}`,
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

  HANDLE_USER_JOINED: async ({ commit, dispatch }, { id, ...rest }) => {
    commit('SET_USER', {
      id,
      data: {
        ...rest,
        updatedAt: Date.now(),
      },
    });

    await dispatch('ADD_MESSAGE_AND_CACHE', {
      senderId: id,
      text: `${rest.username} joined`,
    });
  },

  HANDLE_USER_LEFT: async ({ getters, dispatch, commit }, { id, newHostId }) => {
    await dispatch('ADD_MESSAGE_AND_CACHE', {
      senderId: id,
      text: `${getters.GET_USER(id).username} left the room`,
    });

    if (newHostId) {
      await dispatch('HANDLE_NEW_HOST', newHostId);
    }

    commit('DELETE_USER', id);
  },

  HANDLE_NEW_HOST: async ({ getters, dispatch, commit }, hostId) => {
    // TODO: synchronize!
    commit('SET_HOST_ID', hostId);
    await dispatch('ADD_MESSAGE_AND_CACHE', {
      senderId: hostId,
      text: `${getters.GET_USER(hostId).username} is now the host`,
    });
  },

  HANDLE_HOST_UPDATE: ({ getters, dispatch }, timeline) => {
    if (!getters.GET_HOST_TIMELINE
        || getters.GET_HOST_TIMELINE.state !== timeline.state
        || Math.abs(timeline.time - getters.GET_HOST_TIMELINE.time) < 5000) {
      window.EventBus.$emit('host-playerstate-change');
    }

    return dispatch('SYNCHRONIZE');
  },

  HANDLE_DISCONNECT: async ({ dispatch }) => {
    await dispatch('DISPLAY_NOTIFICATION', 'Disconnected from the SyncLounge server', { root: true });
  },

  HANDLE_RECONNECT: async ({ dispatch }) => {
    console.log('Rejoining');
    await dispatch('JOIN_ROOM_AND_INIT');
  },

  HANDLE_SLPING: async (context, secret) => {
    emit({
      eventName: 'slPong',
      data: secret,
    });
  },

  HANDLE_PLAYER_STATE_UPDATE: ({ commit }, data) => {
    // TODO: probalby sync if its from the hsot
    commit('SET_USER_PLAYER_STATE', data);
  },

  HANDLE_MEDIA_UPDATE: async ({
    getters, dispatch, commit,
  }, {
      id, state, time, duration, media,
    }) => {
    console.log('media update');
    // TODO: maybe sync or play new media thing
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

    if (id === getters.GET_HOST_ID) {
      await dispatch('SYNCHRONIZE');
    }
  },
};
