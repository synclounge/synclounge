import axios from 'axios';

import delay from '@/utils/delay';


function sendNotification(message) {
  return window.EventBus.$emit('notification', message);
}

export default {
  async PLAYBACK_CHANGE({
    commit, state, dispatch, getters,
  }, [, ratingKey, mediaContainer]) {
    if (ratingKey) {
      // Playing something different!
      commit('SET_PLEX_SERVER_ID', mediaContainer.machineIdentifier);
      const server = state.plex.servers[mediaContainer.machineIdentifier];
      commit('settings/SET_LASTSERVER', mediaContainer.machineIdentifier);

      // Fetch our metadata from this server

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

        // TODO: come and fix this
        // eslint-disable-next-line no-param-reassign
        getters.GET_CHOSEN_CLIENT.clientPlayingMetadata = metadata;
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
      // TODO: come and fix this
      // eslint-disable-next-line no-param-reassign
      getters.GET_CHOSEN_CLIENT.clientPlayingMetadata = null;
      const thumb = await dispatch('getRandomThumb');
      if (thumb) {
        state.background = thumb;
      }
    }
  },

  NEW_TIMELINE({
    commit, state, dispatch, getters,
  }, timeline) {
    const client = getters.GET_CHOSEN_CLIENT;
    const metadata = getters.GET_CHOSEN_CLIENT.clientPlayingMetadata || {};

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
    let grandparentTitle = null;
    let parentTitle = null;
    if (getters.GET_CHOSEN_CLIENT.clientPlayingMetadata) {
      rawTitle = metadata.title;
      if (metadata.type === 'episode') {
        title = `${metadata.grandparentTitle} - ${metadata.title} S${metadata.parentIndex}-`
          + `E${metadata.index}`;
        parentTitle = metadata.parentTitle;
        grandparentTitle = metadata.grandparentTitle;
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
      clientResponseTime: getters.GET_CHOSEN_CLIENT.lastResponseTime,
      playerProduct: getters.GET_CHOSEN_CLIENT.product,
      status,
      type,
      grandparentTitle,
      parentTitle,
      uuid: state.uuid,
    };
    if (getters.GET_CHOSEN_CLIENT.lastTimelineObject) {
      endObj.machineIdentifier = getters.GET_CHOSEN_CLIENT.lastTimelineObject.machineIdentifier;
      endObj.key = getters.GET_CHOSEN_CLIENT.lastTimelineObject.key;
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

  START_CLIENT_POLLER: async ({ getters }) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const delayPromise = delay(getters['settings/GET_CLIENTPOLLINTERVAL']);

      // eslint-disable-next-line no-await-in-loop
      await getters.GET_CHOSEN_CLIENT.getTimeline().catch(() => {});
      // eslint-disable-next-line no-await-in-loop
      await delayPromise;
    }
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

  FETCH_CONFIG: async ({ commit }) => {
    const url = window.location.origin + window.location.pathname.replace(/\/+$/, '');
    try {
      const { data } = await axios.get(`${url}/config`);
      commit('SET_CONFIG', data);
    } catch (e) {
      commit('SET_CONFIGURATION_FETCH_ERROR', e);
    }

    commit('SET_CONFIGURATION_FETCHED', true);
  },
};
