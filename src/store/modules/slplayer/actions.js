import axios from 'axios';

import generateGuid from '@/utils/guid';
import timeoutPromise from '@/utils/timeoutpromise';
import delay from '@/utils/delay';

// These functions are a bit special since they use currentTime and duration, which can't
// be tracked by vuex, so the cache isn't updated correctly
const getPlayerCurrentTimeMs = (getters) => (getters.GET_PLAYER_MEDIA_ELEMENT.currentTime * 1000)
  || getters.GET_OFFSET_MS;

const getPlayerDurationMs = (getters) => getters.GET_PLAYER_MEDIA_ELEMENT.duration * 1000;

const makeTimelineParams = ({ getters, rootGetters }) => ({
  ratingKey: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
  key: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].key,
  // playbackTime: 591
  // playQueueItemID: 19037144
  state: getters.GET_PLAYER_STATE,
  hasMDE: 1,
  time: Math.floor(getPlayerCurrentTimeMs(getters)),
  duration: Math.floor(getPlayerDurationMs(getters)),
  'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
  ...getters.GET_PART_PARAMS,
});

const isTimeInBufferedRange = (getters, timeMs) => {
  const bufferedTimeRange = getters.GET_PLAYER_MEDIA_ELEMENT.buffered;

  // There can be multiple ranges
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < bufferedTimeRange.length; ++i) {
    if (timeMs >= bufferedTimeRange.start(i) * 1000 && timeMs <= bufferedTimeRange.end(i) * 1000) {
      return true;
    }
  }

  return false;
};

const isPlayerPaused = (getters) => getters.GET_PLAYER_MEDIA_ELEMENT.paused
  && !getters.GET_PLAYER_UI.getControls().isSeeking();

const isPlayerPlaying = (getters) => !getters.GET_PLAYER_MEDIA_ELEMENT.paused
  && !getters.GET_PLAYER.isBuffering();

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

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, bitrate) => {
    commit('settings/SET_SLPLAYERQUALITY', bitrate, { root: true });
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

  CHANGE_MEDIA_INDEX: ({ commit, dispatch }, index) => {
    commit('SET_MEDIA_INDEX', index);
    return dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  // Changes the player src to the new one and restores the time afterwards
  UPDATE_PLAYER_SRC_AND_KEEP_TIME: async ({ getters, commit, dispatch }) => {
    // Set buffering on src change since player doesn't trigger it then
    dispatch('CHANGE_PLAYER_STATE', 'buffering');
    commit('SET_OFFSET_MS', getPlayerCurrentTimeMs(getters));
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_PLAYER_SRC: async ({ commit, dispatch }) => {
    commit('SET_SESSION', generateGuid());
    await dispatch('SEND_PLEX_DECISION_REQUEST');

    return Promise.all([
      dispatch('CHANGE_PLAYER_STATE', 'buffering'),
      dispatch('LOAD_PLAYER_SRC'),
    ]);
  },

  SEND_PLEX_TIMELINE_UPDATE: ({ getters, rootGetters }) => axios.get(getters.GET_TIMELINE_URL, {
    params: makeTimelineParams({ getters, rootGetters }),
    timeout: 10000,
  }),

  FETCH_TIMELINE_POLL_DATA: ({ getters }) => (getters.GET_PLAYER
    ? {
      time: getPlayerCurrentTimeMs(getters),
      duration: getPlayerDurationMs(getters),
      playerState: getters.GET_PLAYER_STATE,
    }
    : {
      time: 0,
      duration: 0,
      playerState: getters.GET_PLAYER_STATE,
    }),

  HANDLE_PLAYER_PLAYING: ({ dispatch, getters }) => {
    if (isPlayerPlaying(getters)) {
      dispatch('CHANGE_PLAYER_STATE', 'playing');
    }
  },

  HANDLE_PLAYER_PAUSE: ({ dispatch, getters }) => {
    if (isPlayerPaused(getters)) {
      if (!getters.GET_PLAYER.isBuffering()) {
        dispatch('CHANGE_PLAYER_STATE', 'paused');
      }
    }
  },

  HANDLE_PLAYER_BUFFERING: ({ dispatch, getters }, event) => {
    if (event.buffering) {
      dispatch('CHANGE_PLAYER_STATE', 'buffering');
    } else {
      // Report back if player is playing
      dispatch('CHANGE_PLAYER_STATE',
        getters.GET_PLAYER_MEDIA_ELEMENT.paused ? 'paused' : 'playing');
    }
  },

  HANDLE_PLAYER_VOLUME_CHANGE: ({ getters, commit }) => {
    commit('settings/SET_SLPLAYERVOLUME', getters.GET_PLAYER_MEDIA_ELEMENT.volume, { root: true });
  },

  PRESS_PLAY: ({ getters }) => {
    getters.GET_PLAYER_MEDIA_ELEMENT.play();
  },

  PRESS_PAUSE: ({ getters }) => {
    getters.GET_PLAYER_MEDIA_ELEMENT.pause();
  },

  PRESS_STOP: ({ dispatch }) => dispatch('CHANGE_PLAYER_STATE', 'stopped'),

  SOFT_SEEK: ({ getters, commit }, seekToMs) => {
    if (!isTimeInBufferedRange(getters, seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);
    return true;
  },

  NORMAL_SEEK: async ({ getters, commit }, seekToMs) => {
    // TODO: check the logic here to make sense if the seek time is in the past ...
    if (Math.abs(seekToMs - getPlayerCurrentTimeMs(getters)) < 3000
    && getters.GET_PLAYER_STATE === 'playing') {
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
      if (!getters.GET_PLAYER_MEDIA_ELEMENT) {
        return true;
      }

      const delayPromise = delay(10000);
      // eslint-disable-next-line no-await-in-loop
      await dispatch('SEND_PLEX_TIMELINE_UPDATE').catch((e) => e);
      // eslint-disable-next-line no-await-in-loop
      await delayPromise;
    }
  },

  START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: ({ commit, getters }) => {
    commit('SET_PLAYER_CONTROLS_SHOWN_INTERVAL', setInterval(() => {
      commit('UPDATE_PLAYER_CONTROLS_SHOWN', arePlayerControlsShown(getters));
    }, 500));
  },

  CHANGE_PLAYER_STATE: async ({ commit, dispatch }, state) => {
    console.log('CHANGE PLAYER STATE: ', state);
    commit('SET_PLAYER_STATE', state);
    const result = dispatch('SEND_PLEX_TIMELINE_UPDATE');
    await dispatch('synclounge/POLL', null, { root: true });
    return result;
  },

  LOAD_PLAYER_SRC: async ({ getters, commit }) => {
    // TODO: potentailly unload if already loaded to avoid load interrupted errors
    // However, while its loading, potentially   reporting the old time...
    const result = await getters.GET_PLAYER.load(getters.GET_SRC_URL);
    if (getters.GET_OFFSET_MS > 0) {
      commit('SET_PLAYER_CURRENT_TIME_MS', getters.GET_OFFSET_MS);
    }
    return result;
  },

  INIT_PLAYER_STATE: async ({ rootGetters, commit, dispatch }) => {
    await dispatch('REGISTER_PLAYER_EVENTS');
    const result = await dispatch('CHANGE_PLAYER_SRC');

    commit('SET_PLAYER_VOLUME', rootGetters['settings/GET_SLPLAYERVOLUME']);

    await dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');
    await dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    return result;
  },

  DESTROY_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    await dispatch('UNREGISTER_PLAYER_EVENTS');

    commit('plexclients/SET_ACTIVE_MEDIA_METADATA', null, { root: true });
    commit('plexclients/SET_ACTIVE_SERVER_ID', null, { root: true });
    await getters.GET_PLAYER_UI.destroy();
    commit('SET_OFFSET_MS', 0);
    commit('SET_PLAYER', null);
    commit('SET_PLAYER_UI', null);
  },

  REGISTER_PLAYER_EVENTS: ({ commit, dispatch }) => {
    commit('ADD_BUFFERING_EVENT_LISTENER', (e) => dispatch('HANDLE_PLAYER_BUFFERING', e));
  },

  UNREGISTER_PLAYER_EVENTS: ({ commit }) => {
    commit('REMOVE_BUFFERING_EVENT_LISTENER');
  },

  PLAY_PAUSE_VIDEO: ({ getters, commit }) => {
    if (!getPlayerDurationMs(getters)) {
      // Can't play yet.  Ignore.
      return;
    }

    getters.GET_PLAYER.cancelTrickPlay();

    if (isPlayerPaused(getters)) {
      commit('PLAY');
    } else {
      commit('PAUSE');
    }
  },

  SEND_PARTY_PLAY_PAUSE: ({ dispatch, getters, rootGetters }) => {
    // If the player was actually paused (and not just paused for seeking)
    if (!rootGetters.AM_I_HOST && rootGetters.getPartyPausing) {
      dispatch('sendPartyPause', isPlayerPaused(getters), { root: true });
    }
  },
};
