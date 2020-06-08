function sendNotification(message) {
  return window.EventBus.$emit('notification', message);
}

export default {
  async PLAYBACK_CHANGE({ commit, state, dispatch }, [, ratingKey, mediaContainer]) {
    if (ratingKey) {
      // Playing something different!
      const server = state.plex.servers[mediaContainer.machineIdentifier];
      commit('settings/SET_LASTSERVER', mediaContainer.machineIdentifier);
      if (!server) {
        return;
      }
      commit('SET_PLEX_SERVER_ID', mediaContainer.machineIdentifier);
      // Fetch our metadata from this server
      // console.log('Loading content metadata from store ' + ratingKey)
      server.getMediaByRatingKey(ratingKey.replace('/library/metadata/', '')).then((data) => {
        const metadata = data.MediaContainer.Metadata[0];
        if (!metadata) {
          return;
        }
        if (metadata.type === 'movie') {
          sendNotification(`Now Playing: ${metadata.title} from ${server.name}`);
        }
        if (metadata.type === 'episode') {
          sendNotification(`Now Playing: ${metadata.grandparentTitle} S${metadata.parentIndex}E${
            metadata.index
          } from ${server.name}`);
        }
        state.chosenClient.clientPlayingMetadata = metadata;
        const w = Math.round(
          Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        );
        const h = Math.round(
          Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        );
        state.background = server.getUrlForLibraryLoc(
          metadata.thumb,
          w / 4,
          h / 4,
          4,
        );
      });
    } else {
      state.chosenClient.clientPlayingMetadata = null;
      const thumb = await dispatch('getRandomThumb');
      if (thumb) {
        state.background = thumb;
      }
    }
  },

  NEW_TIMELINE({
    commit, state, dispatch, getters,
  }, timeline) {
    // return true
    const client = state.chosenClient;
    const metadata = state.chosenClient.clientPlayingMetadata || {};
    // console.log(state)
    if (!state.chosenClient || client.clientIdentifier !== state.chosenClient.clientIdentifier) {
      console.log('Invalid client');
      return false;
    }
    if (state.lastRatingKey !== timeline.ratingKey) {
      commit('SET_VALUE', ['lastRatingKey', timeline.ratingKey]);
      dispatch('PLAYBACK_CHANGE', [client, timeline.ratingKey, timeline]);
    }

    // Check if we need to activate the upnext feature
    if (state.me && state.me.role === 'host') {
      if (
        timeline.duration
        && timeline.time
        && Math.abs(timeline.duration - timeline.time) < 10000
        && metadata.type === 'episode'
      ) {
        if (!getters.GET_UP_NEXT_TRIGGERED) {
          state.plex.servers[timeline.machineIdentifier]
            .getPostplay(timeline.ratingKey).then((data) => {
              if (data.MediaContainer.Hub[0].Metadata[0].grandparentTitle
                  === metadata.grandparentTitle) {
                commit('SET_UP_NEXT_POST_PLAY_DATA', data);
              }
            });

          commit('SET_UP_NEXT_TRIGGERED', true);
        }
      } else if (getters.GET_UP_NEXT_TRIGGERED) {
        // If outside upnext period, reset triggered
        commit('SET_UP_NEXT_TRIGGERED', false);
      }
    }

    // state.ourClientResponseTime = timeline.lastResponseTime
    let title = null;
    let rawTitle = null;
    let type = null;
    let showName = null;
    if (state.chosenClient.clientPlayingMetadata) {
      rawTitle = metadata.title;
      if (metadata.type === 'episode') {
        title = `${metadata.grandparentTitle} - ${metadata.title} S${metadata.parentIndex}-`
          + `E${metadata.index}`;
        showName = metadata.grandparentTitle;
      } else {
        title = metadata.title;
      }
      type = metadata.type;
    }
    let status = 'good';
    if (!state.synclounge.lastHostTimeline
      || Number.isNaN(state.synclounge.lastHostTimeline.time)) {
      status = 'error';
    } else {
      const hostAge = Math.abs(new Date().getTime() - state.synclounge.lastHostTimeline.recievedAt);
      let hostTime = 0 + state.synclounge.lastHostTimeline.time;
      if (state.synclounge.lastHostTimeline.playerState === 'playing') {
        hostTime = parseInt(hostTime, 10) + parseInt(hostAge, 10);
      }
      const difference = Math.abs(timeline.time - hostTime);
      if (difference > getters['settings/GET_SYNCFLEXIBILITY']) {
        status = 'notok';
      }
    }

    const endObj = {
      time: parseInt(timeline.time, 10),
      maxTime: parseInt(timeline.duration, 10),
      title,
      rawTitle,
      playerState: timeline.state,
      clientResponseTime: state.chosenClient.lastResponseTime,
      playerProduct: state.chosenClient.product,
      status,
      type,
      showName,
      uuid: state.uuid,
    };
    if (state.chosenClient && state.chosenClient.lastTimelineObject) {
      endObj.machineIdentifier = state.chosenClient.lastTimelineObject.machineIdentifier;
      endObj.key = state.chosenClient.lastTimelineObject.key;
    }
    if (state.synclounge.socket) {
      const commandId = Object.keys(state.synclounge.commands).length + 1;
      state.synclounge.commands[commandId] = {
        start: new Date().getTime(),
      };
      endObj.commandId = commandId;
      if (Object.keys(state.synclounge.commands).length > 1) {
        const latency = state.synclounge.commands[Object.keys(state.synclounge.commands).length - 1]
          .difference;
        endObj.latency = latency;
      }
      state.synclounge.socket.emit('poll', endObj);
    }

    return true;
  },
  SET_LEFT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_LEFT_SIDEBAR_OPEN', open);
  },
  SET_RIGHT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_RIGHT_SIDEBAR_OPEN', open);
  },
  TOGGLE_RIGHT_SIDEBAR_OPEN: ({ commit }) => {
    commit('TOGGLE_RIGHT_SIDEBAR_OPEN');
  },

  CHOOSE_CLIENT: ({ commit, state, getters }, client) => {
    // Set up our client poller
    let commandInProgress = false;

    function clientPoller(time) {
      if (!state.chosenClient) {
        return;
      }

      if (state.chosenClientTimeSet !== time) {
        // We have a new chosen client, we need to stop
        return;
      }

      if (state.chosenClient.clientIdentifier !== 'PTPLAYER9PLUS10') {
        if (!commandInProgress) {
          state.chosenClient
            .getTimeline()
            .then(() => {
              commandInProgress = false;
            })
            .catch(() => {
              commandInProgress = false;
            });
          commandInProgress = true;
        }
      } else {
        state.chosenClient.getTimeline();
      }

      setTimeout(() => {
        clientPoller(time);
      }, getters['settings/GET_CLIENTPOLLINTERVAL']);
    }

    // Check if we need to remove old handlers
    if (state.chosenClient) {
      state.chosenClient.events.removeAllListeners();
    }

    commit('SET_CHOSENCLIENT', client);
    if (state.chosenClient && state.chosenClient.lastTimelineObject) {
      state.chosenClient.lastTimelineObject.ratingKey = -1;
    }
    if (state.chosenClient == null) {
      return;
    }
    state.chosenClientTimeSet = new Date().getTime();
    clientPoller(state.chosenClientTimeSet);
    state.chosenClient.getTimeline(() => { });
  },

  TRIGGER_MANUAL_SYNC: ({ commit }) => {
    commit('SET_MANUAL_SYNC_QUEUED', true);
  },

  SET_RANDOMBACKROUND: async ({ dispatch, commit }) => {
    const result = await dispatch('getRandomThumb').catch(() => { });
    if (result) {
      commit('SET_BACKGROUND', result);
    }
  },
};
