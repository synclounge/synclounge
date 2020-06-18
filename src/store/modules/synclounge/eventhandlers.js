export default {
  HANDLE_SUCCESSFUL_JOIN_RESULT: ({
    getters, state, commit, dispatch,
  }, {
    result, _data, currentUsers, partyPausing,
  }) => {
    console.log('Got join result', result);
    commit('CLEAR_MESSAGES');

    commit('SET_USERS', currentUsers);
    // commit('SET_ME', _data.username);
    commit('SET_PARTYPAUSING', partyPausing);
    commit('SET_ROOM', _data.room);

    sendNotification(`Joined room: ${_data.room}`);
    // Add this item to our recently-connected list
    dispatch(
      'settings/ADD_RECENT_ROOM',
      {
        server: state.server,
        room: state.room,
        password: state.password,
        time: new Date().getTime(),
      },
      { root: true },
    );

    getters.GET_SOCKET.on('poll-result', (users, me, commandId) => {
      dispatch('HANDLE_POLL_RESULT', { users, me, commandId });
    });

    getters.GET_SOCKET.on('party-pausing-changed', (res) => {
      dispatch('HANDLE_PARTY_PAUSING_CHANGED', res);
    });

    getters.GET_SOCKET.on('party-pausing-pause', (res) => {
      dispatch('HANDLE_PARTY_PAUSING_PAUSE', res);
    });

    getters.GET_SOCKET.on('user-joined', (users, user) => {
      dispatch('HANDLE_USER_JOINED', { users, user });
    });

    getters.GET_SOCKET.on('user-left', (users, user) => {
      dispatch('HANDLE_USER_LEFT', { users, user });
    });

    getters.GET_SOCKET.on('host-swap', (user) => {
      dispatch('HANDLE_HOST_SWAP', user);
    });

    state.socket.on('host-update', (hostData) => {
      dispatch('HANDLE_HOST_UPDATE', hostData);
    });

    state.socket.on('disconnect', (disconnectData) => {
      dispatch('HANDLE_DISCONNECT', disconnectData);
    });

    state.socket.on('new_message', (msgObj) => {
      commit('ADD_MESSAGE', msgObj);
    });

    dispatch('START_CLIENT_POLLER');
  },

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

  HANDLE_PARTY_PAUSING_PAUSE: ({ commit, rootGetters }, { isPause, user }) => {
    const messageText = `${user.username} pressed ${isPause ? 'pause' : 'play'}`;
    commit('ADD_MESSAGE', {
      msg: messageText,
      user,
      type: 'alert',
    });

    sendNotification(messageText);
    if (rootGetters.GET_CHOSEN_CLIENT) {
      if (isPause) {
        rootGetters.GET_CHOSEN_CLIENT.pressPause();
      } else {
        rootGetters.GET_CHOSEN_CLIENT.pressPlay();
      }
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
        || getters.GET_HOST_TIMELINE.playerState !== timeline.playerState
        || Math.abs(timeline.time - getters.GET_HOST_TIMELINE.time) < 5000) {
      window.EventBus.$emit('host-playerstate-change');
    }

    commit('SET_HOST_TIMELINE', {
      ...timeline,
      recievedAt: Date.now(),
    });

    return dispatch('SYNCHRONIZE');
  },

  SYNCHRONIZE: async ({
    getters, commit, dispatch, rootGetters,
  }) => {
    /* This is data from the host, we should react to this data by potentially changing
        what we're playing or seeking to get back in sync with the host.

        We need to limit how ourself to make sure we dont hit the client too hard.
        We'll only fetch new data if our data is older than 1000ms.
        If we need to fetch new data, we'll do that and then decide
        if we need to seek or start playing something.
      */

    // TODO: move this manual sync into this module
    if (rootGetters.GET_MANUAL_SYNC_QUEUED) {
      window.EventBus.$emit('host-playerstate-change');
      await rootGetters.GET_CHOSEN_CLIENT.seekTo(getters.GET_HOST_TIMELINE.time);
      commit('SET_MANUAL_SYNC_QUEUED', false, { root: true });
      return;
    }

    // console.log('Timeline age is', timelineAge);
    try {
      // if ((timelineAge > 1000 && rootState.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10') || rootState.chosenClient.clientIdentifier === 'PTPLAYER9PLUS10') {
      //   await rootState.chosenClient.getTimeline()
      //   await decisionMaker(0)
      // } else {
      await decisionMaker();
      // }
    } catch (e) {
      console.log('Error caught in sync logic', e);
    }
  },

  DECISION_MAKE: async ({
    getters, commit, dispatch, rootGetters,
  }) => {
    const ourTimeline = rootGetters.GET_CHOSEN_CLIENT.lastTimelineObject;

    if (ourTimeline.playerState === 'buffering') {
      return;
    }

    if ((!getters.GET_HOST_TIMELINE.playerState || getters.GET_HOST_TIMELINE.playerState === 'stopped')
          && ourTimeline.state !== 'stopped') {
      sendNotification('The host pressed stop');
      await rootGetters.GET_CHOSEN_CLIENT.pressStop();
      return;
    }

    if (hostTimeline.playerState === 'stopped') {
      return;
    }
    // Check if we need to autoplay
    if (
      ((ourTimeline.state === 'stopped' || !ourTimeline.state)
            && hostTimeline.playerState !== 'stopped')
          || state.rawTitle !== hostTimeline.rawTitle
    ) {
      if (rootState.blockAutoPlay || !hostTimeline.rawTitle) {
        return;
      }
      // We need to autoplay!
      if (!rootGetters['settings/GET_AUTOPLAY']) {
        return;
      }
      commit('SET_BLOCK_AUTOPLAY', true, { root: true });

      commit('SET_RAW_TITLE', hostTimeline.rawTitle);
      sendNotification(`Searching Plex Servers for "${hostTimeline.rawTitle}"`);

      const bestMatch = await dispatch('FIND_BEST_MEDIA_MATCH', hostTimeline, { root: true });
      if (bestMatch) {
        await dispatch('PLEX_CLIENT_PLAY_MEDIA', {
          // TODO: have timeline updates send out more info like mediaIdentifier etc
          key: bestMatch.key,
          mediaIndex: bestMatch.mediaIndex || 0,
          serverIdentifier: bestMatch.machineIdentifier,
          offset: hostTimeline.time || 0,
        }).catch(() => {});
      } else {
        sendNotification(
          `Failed to find a compatible copy of ${hostTimeline.rawTitle}. If you have access to the content try manually playing it.`,
        );
      }

      setTimeout(() => {
        commit('SET_BLOCK_AUTOPLAY', false, { root: true });
      }, 15000);
      return;
    }

    if (hostTimeline.playerState === 'playing' && ourTimeline.state === 'paused') {
      sendNotification('Resuming..');
      await rootGetters.GET_CHOSEN_CLIENT.pressPlay();
      return;
    }

    if ((hostTimeline.playerState === 'paused'
          || hostTimeline.playerState === 'buffering')
          && ourTimeline.state === 'playing') {
      sendNotification('Pausing..');
      await rootGetters.GET_CHOSEN_CLIENT.pressPause();
      return;
    }

    if (hostTimeline.playerState === 'playing') {
      // Add on the delay between us and the SLServer plus the delay between the server and the host
      hostUpdateData.time = hostUpdateData.time + (getters.GET_SRTT || 0)
              + (hostTimeline.latency || 0);
    }

    try {
      await rootGetters.GET_CHOSEN_CLIENT.sync(
        hostUpdateData,
        rootGetters['settings/GET_SYNCFLEXIBILITY'],
        rootGetters['settings/GET_SYNCMODE'],
        rootGetters['settings/GET_CLIENTPOLLINTERVAL'],
      );
    } catch (e) {
      console.log(e);
    }
  },

  HANDLE_DISCONNECT: ({ commit }, disconnectData) => {
    sendNotification('Disconnected from the SyncLounge server');
    console.log('Disconnect data', disconnectData);
    if (disconnectData === 'io client disconnect') {
      console.log('We disconnected from the server');
      commit('SET_ROOM', null);
      commit('SET_PASSWORD', null);
      commit('SET_USERS', []);
      commit('SET_SERVER', null);
    } else if (disconnectData === 'transport close') {
      console.log('The server disconnected on us');
    }
  },
};
