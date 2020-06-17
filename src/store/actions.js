import axios from 'axios';
import sizing from '@/utils/sizing';

export default {
  SET_LEFT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_LEFT_SIDEBAR_OPEN', open);
  },

  SET_RIGHT_SIDEBAR_OPEN: ({ commit }, open) => {
    commit('SET_RIGHT_SIDEBAR_OPEN', open);
  },

  TOGGLE_RIGHT_SIDEBAR_OPEN: ({ commit }) => {
    commit('TOGGLE_RIGHT_SIDEBAR_OPEN');
  },

  TRIGGER_MANUAL_SYNC: ({ commit }) => {
    commit('SET_MANUAL_SYNC_QUEUED', true);
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

  NEW_TIMELINE: ({ commit, getters }, timeline) => {
    // Check if we need to activate the upnext feature
    if (getters['synclounge/AM_I_HOST']) {
      if (timeline.duration && timeline.time
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

    return true;
  },

  PLAYBACK_CHANGE: async ({ commit, dispatch, getters }, { machineIdentifier, metadata }) => {
    if (metadata) {
      // Playing something different!
      commit('plexservers/SET_LAST_SERVER_ID', machineIdentifier, { root: true });

      const serverName = getters['plexservers/GET_PLEX_SERVER'](machineIdentifier).name;

      // eslint-disable-next-line default-case
      switch (metadata.type) {
        case 'movie': {
          dispatch('DISPLAY_NOTIFICATION',
            `Now Playing: ${metadata.title} from ${serverName}`);
          break;
        }

        case 'episode': {
          dispatch('DISPLAY_NOTIFICATION',
            `Now Playing: ${metadata.grandparentTitle} S${metadata.parentIndex}E${
              metadata.index
            } from ${serverName}`);
          break;
        }
      }

      commit('SET_BACKGROUND',
        getters['plexservers/GET_MEDIA_IMAGE_URL']({
          machineIdentifier,
          mediaUrl: metadata.thumb,
          width: sizing.getAppWidth() / 4,
          height: sizing.getAppHeight() / 4,
          blur: 4,
        }));
    } else {
      const thumb = await dispatch('plexservers/FETCH_RANDOM_THUMB_URL');
      commit('SET_BACKGROUND', thumb);
    }
  },

  DISPLAY_NOTIFICATION: (message) => window.EventBus.$emit('notification', message),
};
