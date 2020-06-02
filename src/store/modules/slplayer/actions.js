import axios from 'axios';

import generateGuid from '@/utils/guid';
import timeoutPromise from '@/utils/timeoutpromise';
import delay from '@/utils/delay';


const commandActions = command => ({
  '/player/timeline/poll': 'DO_COMMAND_POLL',
  '/player/playback/play': 'DO_COMMAND_PLAY',
  '/player/playback/pause': 'DO_COMMAND_PAUSE',
  '/player/playback/playMedia': 'DO_COMMAND_PLAY_MEDIA',
  '/player/playback/stop': 'DO_COMMAND_STOP',
  '/player/playback/seekTo': 'DO_COMMAND_SEEK_TO',
})[command];


export default {
  SEND_PLEX_DECISION_REQUEST: async ({ getters, commit }) => {
    const { data } = await axios.get(getters.GET_DECISION_URL, {
      params: getters.GET_DECISION_AND_START_PARAMS,
    });
    commit('SET_PLEX_DECISION', data);
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, maxVideoBitrate) => {
    // TODO: save to localStore persistently
    commit('SET_MAX_VIDEO_BITRATE', maxVideoBitrate);
    return dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_AUDIO_STREAM: async ({ getters, dispatch }, audioStreamID) => {
    await axios.put(getters.GET_PART_URL, null, {
      params: {
        audioStreamID,
        ...getters.GET_PART_PARAMS,
      },
    });

    // Redo src
    return dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, commit, dispatch }, subtitleStreamID) => {
    await axios.put(getters.GET_PART_URL, null, {
      params: {
        subtitleStreamID,
        ...getters.GET_PART_PARAMS,
      },
    });

    // Redo src
    return dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  FETCH_METADATA: async ({ commit, getters }) => {
    const result = await getters.GET_PLEX_SERVER.getMediaByRatingKey(getters.GET_RATING_KEY);
    // Always media 0

    commit('SET_METADATA', result.MediaContainer.Metadata[0]);
    return true;
  },

  CHANGE_MEDIA_INDEX: ({ commit, dispatch }, index) => {
    commit('SET_MEDIA_INDEX', index);
    return dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  // Changes the player src to the new one and restores the time afterwards
  UPDATE_PLAYER_SRC_AND_KEEP_TIME: async ({ getters, commit, dispatch }) => {
    commit('SET_OFFSET', getters.GET_PLAYER_CURRENT_TIME_MS);
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_PLAYER_SRC: async ({ getters, commit, dispatch }) => {
    commit('SET_SESSION', generateGuid());
    await dispatch('SEND_PLEX_DECISION_REQUEST');
    commit('SET_PLAYER_SRC', getters.GET_SRC_OBJECT);

    // Using ready so it executes immediately after changing src.
    getters.GET_PLAYER.ready(() => {
      commit('SET_PLAYER_CURRENT_TIME_MS', getters.GET_OFFSET);
    });
  },

  SEND_PLEX_TIMELINE_UPDATE: ({ getters }) => axios.get(getters.GET_TIMELINE_URL, {
    params: getters.GET_TIMELINE_PARAMS,
    timeout: 10000,
  }),

  HANDLE_PLAYER_PLAYING: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'playing'),

  HANDLE_PLAYER_PAUSE: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'paused'),

  HANDLE_PLAYER_SEEKING: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'buffering'),

  HANDLE_PLAYER_SEEKED: ({ getters, dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', getters.GET_PLAYER.paused() ? 'paused' : 'playing'),

  HANDLE_PLAYER_WAITING: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'buffering'),

  HANDLE_PLAYER_VOLUME_CHANGE: ({ getters, commit }) => {
    commit('setSetting', ['PTPLAYERVOLUME', getters.GET_PLAYER.volume() || 0], { root: true });
  },


  // Command handlers
  HANDLE_COMMAND: async ({ dispatch }, { command, params, callback }) => {
    const result = await dispatch('DO_COMMAND_DISPATCH', { action: commandActions(command), params })
      .catch(console.warn);
    callback(result);
  },

  DO_COMMAND_DISPATCH: async ({ dispatch }, { action, params }) =>
    dispatch(action, params),

  DO_COMMAND_POLL: ({ getters }) => getters.GET_POLL_RESPONSE,

  DO_COMMAND_PLAY: ({ getters, commit }) => {
    if (getters.GET_PLAYER_STATE !== 'playing') {
      commit('PLAY');
    }
  },

  DO_COMMAND_PAUSE: ({ getters, commit }) => {
    if (getters.GET_PLAYER_STATE !== 'paused') {
      commit('PAUSE');
    }
  },

  DO_COMMAND_PLAY_MEDIA: ({ commit, dispatch }, {
    offset, machineIdentifier, mediaIndex, key,
  }) => {
    commit('SET_PLEX_SERVER_ID', machineIdentifier);
    commit('SET_RATING_KEY', key.replace('/library/metadata/', ''));
    commit('SET_MEDIA_INDEX', mediaIndex);
    commit('SET_OFFSET', offset);

    return Promise.all(
      dispatch('CHANGE_PLAYER_SRC'),
      dispatch('FETCH_METADATA'),
    );
  },

  DO_COMMAND_STOP: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'stopped'),


  DO_COMMAND_SEEK_TO: async ({ getters, dispatch }, { offset: seekToMs, softSeek }) => {
    if (Number.isNaN(getters.GET_PLAYER_DURATION_MS)) {
      throw new Error('Player is not ready');
    }

    if (softSeek) {
      return dispatch('SOFT_SEEK', seekToMs);
    }

    return dispatch('NORMAL_SEEK', seekToMs);
  },

  SOFT_SEEK: ({ getters, commit }, seekToMs) => {
    if (!getters.IS_TIME_IN_BUFFERED_RANGE(seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);
    return true;
  },

  NORMAL_SEEK: async ({ getters, commit, rootGetters }, seekToMs) => {
    if ((Math.abs(seekToMs - getters.GET_PLAYER_CURRENT_TIME_MS) < 3000 && rootGetters.GET_HOST_PLAYER_STATE === 'playing')) {
      let cancelled = false;

      window.EventBus.$once('host-playerstate-change', () => {
        cancelled = true;
      });

      let iterations = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-underscore-dangle
        if (cancelled || getters.GET_PLAYER_STATE !== 'playing') {
          commit('SET_PLAYER_PLAYBACK_RATE', 1.0);
          throw new Error('Slow seek was stop due to buffering or pausing');
        }

        const delayPromise = delay(25);

        // 25 here because interval is 25ms
        const expectedHostTimeMs = seekToMs + (25 * iterations);

        const difference = expectedHostTimeMs - getters.GET_PLAYER_CURRENT_TIME_MS;
        const absDifference = Math.abs(difference);

        if (absDifference < 30) {
          commit('SET_PLAYER_PLAYBACK_RATE', 1.0);
          return true;
        }

        if (absDifference > 5000) {
          commit('SET_PLAYER_PLAYBACK_RATE', 1.0);
          throw new Error('Slow seek was stopped as we are beyond 5000ms');
        }

        if (difference > 0) {
          if (getters.GET_PLAYER.playbackRate() < 1.02) {
            // Speed up
            commit('SET_PLAYER_PLAYBACK_RATE', getters.GET_PLAYER.playbackRate() + 0.0001);
          }
        } else if (getters.GET_PLAYER.playbackRate() > 0.98) {
          // Slow down
          commit('SET_PLAYER_PLAYBACK_RATE', getters.GET_PLAYER.playbackRate() - 0.0001);
        }

        // eslint-disable-next-line no-await-in-loop
        await delayPromise;

        iterations += 1;
      }
    } else {
      commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);

      const seekedPromise = new Promise((resolve) => {
        getters.GET_PLAYER.one('seeked', (e) => {
          resolve(e.data);
        });
      });

      return timeoutPromise(seekedPromise, 15000);
    }
  },

  PERIODIC_PLEX_TIMELINE_UPDATE_STARTER: async ({ getters, dispatch }) => {
    // Send out a timeline update to plex periodically.

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!getters.GET_PLAYER) {
        return true;
      }

      const delayPromise = delay(10000);
      // eslint-disable-next-line no-await-in-loop
      await dispatch('SEND_PLEX_TIMELINE_UPDATE').catch(e => e);
      // eslint-disable-next-line no-await-in-loop
      await delayPromise;
    }
  },

  UPDATE_CLIENT_TIMELINE: ({ getters, rootGetters }) => {
    rootGetters.getChosenClient.updateTimelineObject(getters.GET_POLL_RESPONSE);
  },

  CHANGE_PLAYER_STATE: ({ commit, dispatch }, state) => {
    commit('SET_PLAYER_STATE', state);
    const result = dispatch('SEND_PLEX_TIMELINE_UPDATE');
    dispatch('UPDATE_CLIENT_TIMELINE');
    return result;
  },
};
