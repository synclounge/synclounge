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

// These functions are a bit special since they use currentTime and duration, which can't
// be tracked by vuex, so the cache isn't updated correctly
const getPlayerCurrentTimeMs = (getters) =>
  (getters.GET_PLAYER_MEDIA_ELEMENT.currentTime * 1000) || getters.GET_OFFSET_MS;

const getPlayerDurationMs = (getters) => getters.GET_PLAYER_MEDIA_ELEMENT.duration * 1000;

const makeTimelineParams = (getters) => ({
  ratingKey: getters.GET_RATING_KEY,
  key: getters.GET_KEY,
  // playbackTime: 591
  // playQueueItemID: 19037144
  state: getters.GET_PLAYER_STATE,
  hasMDE: 1,
  time: Math.floor(getPlayerCurrentTimeMs(getters)),
  duration: Math.floor(getPlayerDurationMs(getters)),
  'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
  ...getters.GET_PART_PARAMS,
});

const makePollResponse =  (getters) => ({
  ratingKey: getters.GET_RATING_KEY,
  key: getters.GET_KEY,
  time: getPlayerCurrentTimeMs(getters),
  duration: getPlayerDurationMs(getters),
  type: 'video',
  machineIdentifier: getters.GET_PLEX_SERVER_ID,
  state: getters.GET_PLAYER_STATE,
});

const isTimeInBufferedRange = (getters, timeMs) => {
  const bufferedTimeRange = getters.GET_PLAYER_MEDIA_ELEMENT.buffered;

  // There can be multiple ranges
  for (let i = 0; i < bufferedTimeRange.length; ++i) {
    if (timeMs >= bufferedTimeRange.start(i) * 1000 && timeMs <= bufferedTimeRange.end(i) * 1000) {
      return true;
    }
  }

  return false;
};

const arePlayerControlsShown = (getters) => {
  // eslint-disable-next-line no-underscore-dangle
  if (!getters.GET_PLAYER_UI.getControls().enabled_) {
    return false;
  }

  // eslint-disable-next-line no-underscore-dangle
  return getters.GET_PLAYER_UI.getControls().getControlsContainer().getAttribute('shown') != null
    // eslint-disable-next-line no-underscore-dangle
    || getters.GET_PLAYER_UI.getControls().getControlsContainer().getAttribute('casting') != null;
};

export default {
  SEND_PLEX_DECISION_REQUEST: async ({ getters, commit }) => {
    const { data } = await axios.get(getters.GET_DECISION_URL, {
      params: getters.GET_DECISION_AND_START_PARAMS,
    });
    commit('SET_PLEX_DECISION', data);
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, getters, dispatch }, bitrate) => {
    // TODO: save to localStore persistently
    const quality = getters.GET_QUALITIES.find(({ maxVideoBitrate }) => maxVideoBitrate === bitrate);
    commit('setSettingPTPLAYERQUALITY', quality.label, { root: true });
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

  CHANGE_SUBTITLE_STREAM: async ({ getters, dispatch }, subtitleStreamID) => {
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
    commit('SET_OFFSET_MS', getPlayerCurrentTimeMs(getters));
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_PLAYER_SRC: async ({ commit, dispatch }) => {
    commit('SET_SESSION', generateGuid());
    await dispatch('SEND_PLEX_DECISION_REQUEST');
    return dispatch('LOAD_PLAYER_SRC');
  },

  SEND_PLEX_TIMELINE_UPDATE: ({ getters }) =>
    axios.get(getters.GET_TIMELINE_URL, {
      params: makeTimelineParams(getters),
      timeout: 10000,
    }),

  HANDLE_PLAYER_PLAYING: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'playing'),

  HANDLE_PLAYER_PAUSE: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'paused'),

  HANDLE_PLAYER_SEEKING: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'buffering'),

  HANDLE_PLAYER_SEEKED: ({ getters, dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', getters.GET_PLAYER_MEDIA_ELEMENT.paused ? 'paused' : 'playing'),

  HANDLE_PLAYER_WAITING: ({ dispatch }) =>
    dispatch('CHANGE_PLAYER_STATE', 'buffering'),

  HANDLE_PLAYER_VOLUME_CHANGE: ({ getters, commit }) => {
    commit('setSettingPTPLAYERVOLUME', getters.GET_PLAYER_MEDIA_ELEMENT.volume, { root: true });
  },


  // Command handlers
  HANDLE_COMMAND: async ({ dispatch }, { command, params, callback }) => {
    const result = await dispatch('DO_COMMAND_DISPATCH', { action: commandActions(command), params })
      .catch(console.warn);
    callback(result);
  },

  DO_COMMAND_DISPATCH: async ({ dispatch }, { action, params }) =>
    dispatch(action, params),

  DO_COMMAND_POLL: ({ getters }) => makePollResponse(getters),

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
    commit('SET_OFFSET_MS', offset);

    return Promise.all(
      dispatch('CHANGE_PLAYER_SRC'),
      dispatch('FETCH_METADATA'),
    );
  },

  DO_COMMAND_STOP: ({ dispatch }) => 
    dispatch('CHANGE_PLAYER_STATE', 'stopped'),


  DO_COMMAND_SEEK_TO: async ({ getters, dispatch }, { offset: seekToMs, softSeek }) => {
    if (Number.isNaN(getPlayerDurationMs(getters))) {
      throw new Error('Player is not ready');
    }

    if (softSeek) {
      return dispatch('SOFT_SEEK', seekToMs);
    }

    return dispatch('NORMAL_SEEK', seekToMs);
  },

  SOFT_SEEK: ({ getters, commit }, seekToMs) => {
    if (!isTimeInBufferedRange(getters, seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);
    return true;
  },

  NORMAL_SEEK: async ({ getters, commit, rootGetters }, seekToMs) => {
    if ((Math.abs(seekToMs - getPlayerCurrentTimeMs(getters)) < 3000 && rootGetters.GET_HOST_PLAYER_STATE === 'playing')) {
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

        const difference = expectedHostTimeMs - getPlayerCurrentTimeMs(getters);
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
          if (getters.GET_PLAYER.getPlaybackRate() < 1.02) {
            // Speed up
            commit('SET_PLAYER_PLAYBACK_RATE', getters.GET_PLAYER.getPlaybackRate() + 0.0001);
          }
        } else if (getters.GET_PLAYER.getPlaybackRate() > 0.98) {
          // Slow down
          commit('SET_PLAYER_PLAYBACK_RATE', getters.GET_PLAYER.getPlaybackRate() - 0.0001);
        }

        // eslint-disable-next-line no-await-in-loop
        await delayPromise;

        iterations += 1;
      }
    } else {
      commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);

      const seekedPromise = new Promise((resolve) => {
        getters.GET_PLAYER_MEDIA_ELEMENT.addEventListener('seeked', (e) => {
          resolve(e.data);
        }, { once: true });
      });

      return timeoutPromise(seekedPromise, 15000);
    }
  },

  START_PERIODIC_PLEX_TIMELINE_UPDATE: async ({ getters, dispatch }) => {
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

  START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: ({ commit, getters }) => {
    commit('SET_PLAYER_CONTROLS_SHOWN_INTERVAL', setInterval(() => {
      commit('UPDATE_PLAYER_CONTROLS_SHOWN', arePlayerControlsShown(getters));
    }, 500));
  },

  UPDATE_CLIENT_TIMELINE: ({ getters, rootGetters }) => {
    rootGetters.getChosenClient.updateTimelineObject(makePollResponse(getters));
  },

  CHANGE_PLAYER_STATE: ({ commit, dispatch }, state) => {
    commit('SET_PLAYER_STATE', state);
    const result = dispatch('SEND_PLEX_TIMELINE_UPDATE');
    dispatch('UPDATE_CLIENT_TIMELINE');
    return result;
  },

  LOAD_PLAYER_SRC: async ({ getters, commit }) => {
    const result = await getters.GET_PLAYER.load(getters.GET_SRC_URL);
    commit('SET_PLAYER_CURRENT_TIME_MS', getters.GET_OFFSET_MS);
    return result;
  },

  INIT_PLAYER_STATE: async ({ rootGetters, commit, dispatch }) => {
    const result = await dispatch('CHANGE_PLAYER_SRC');
    const volume = rootGetters.getSettingPTPLAYERVOLUME
      || parseFloat(JSON.parse(window.localStorage.getItem('PTPLAYERVOLUME')) || 1);

    commit('SET_PLAYER_VOLUME', volume);

    dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');
    dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    return result;
  },

  DESTROY_PLAYER_STATE: ({ commit }) => {
    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    commit('DESTROY_PLAYER');
  },
};
