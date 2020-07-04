import axios from 'axios';

import guid from '@/utils/guid';
import timeoutPromise from '@/utils/timeoutpromise';
import delay from '@/utils/delay';
import cancelablePeriodicTask from '@/utils/cancelableperiodictask';

// These functions are a bit special since they use currentTime and duration, which can't
// be tracked by vuex, so the cache isn't updated correctly
const getPlayerCurrentTimeMs = (getters) => (getters.GET_PLAYER_MEDIA_ELEMENT.currentTime * 1000)
  || getters.GET_OFFSET_MS;

const getPlayerDurationMs = (getters) => getters.GET_PLAYER_MEDIA_ELEMENT.duration * 1000;

const makeTimelineParams = ({ getters, rootGetters }) => ({
  ratingKey: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
  key: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].key,
  // playbackTime: 591
  playQueueItemID: rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].playQueueItemID,
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

export default {
  FETCH_ARE_PLAYER_CONTROLS_SHOWN: ({ getters }) => {
    // This can't be a normal getter becasuse shaka isn't reactive
    // eslint-disable-next-line no-underscore-dangle
    if (!getters.GET_PLAYER_UI.getControls().enabled_) {
      return false;
    }

    // eslint-disable-next-line no-underscore-dangle
    return getters.GET_PLAYER_UI.getControls().getControlsContainer().getAttribute('shown') != null
    // eslint-disable-next-line no-underscore-dangle
    || getters.GET_PLAYER_UI.getControls().getControlsContainer().getAttribute('casting') != null;
  },

  SEND_PLEX_DECISION_REQUEST: async ({ getters, commit }) => {
    const { data } = await axios.get(getters.GET_DECISION_URL, {
      params: getters.GET_DECISION_AND_START_PARAMS,
    });
    commit('SET_PLEX_DECISION', data);
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, bitrate) => {
    commit('settings/SET_SLPLAYERQUALITY', bitrate, { root: true });
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_AUDIO_STREAM: async ({ getters, dispatch }, audioStreamID) => {
    await axios.put(getters.GET_PART_URL, null, {
      params: {
        audioStreamID,
        ...getters.GET_PART_PARAMS,
      },
    });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, dispatch }, subtitleStreamID) => {
    await axios.put(getters.GET_PART_URL, null, {
      params: {
        subtitleStreamID,
        ...getters.GET_PART_PARAMS,
      },
    });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_MEDIA_INDEX: async ({ commit, dispatch }, index) => {
    commit('SET_MEDIA_INDEX', index);
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  // Changes the player src to the new one and restores the time afterwards
  UPDATE_PLAYER_SRC_AND_KEEP_TIME: async ({ getters, commit, dispatch }) => {
    // Set buffering on src change since player doesn't trigger it then
    await dispatch('CHANGE_PLAYER_STATE', 'buffering');
    commit('SET_OFFSET_MS', getPlayerCurrentTimeMs(getters));
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_PLAYER_SRC: async ({ commit, dispatch }) => {
    commit('SET_SESSION', guid());
    await dispatch('SEND_PLEX_DECISION_REQUEST');

    await Promise.all([
      dispatch('CHANGE_PLAYER_STATE', 'buffering'),
      dispatch('LOAD_PLAYER_SRC'),
    ]);
  },

  SEND_PLEX_TIMELINE_UPDATE: async ({ getters, rootGetters }) => {
    await axios.get(getters.GET_TIMELINE_URL, {
      params: makeTimelineParams({ getters, rootGetters }),
      timeout: 10000,
    });
  },

  FETCH_TIMELINE_POLL_DATA: ({ getters }) => (getters.GET_PLAYER_MEDIA_ELEMENT
    ? {
      time: getPlayerCurrentTimeMs(getters),
      duration: getPlayerDurationMs(getters),
      state: getters.GET_PLAYER_STATE,
    }
    : {
      time: 0,
      duration: 0,
      state: getters.GET_PLAYER_STATE,
    }),

  HANDLE_PLAYER_PLAYING: async ({ dispatch, getters }) => {
    if (getters.IS_PLAYER_PLAYING()) {
      await dispatch('CHANGE_PLAYER_STATE', 'playing');
    }
  },

  HANDLE_PLAYER_PAUSE: async ({ dispatch, getters }) => {
    if (getters.IS_PLAYER_PAUSED()) {
      if (!getters.GET_PLAYER.isBuffering()) {
        await dispatch('CHANGE_PLAYER_STATE', 'paused');
      }
    }
  },

  HANDLE_PLAYER_BUFFERING: async ({ dispatch, getters }, event) => {
    if (event.buffering) {
      await dispatch('CHANGE_PLAYER_STATE', 'buffering');
    } else {
      // Report back if player is playing
      await dispatch('CHANGE_PLAYER_STATE',
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

  PRESS_STOP: async ({ dispatch }) => {
    await dispatch('CHANGE_PLAYER_STATE', 'stopped');
  },

  SOFT_SEEK: ({ getters, commit }, seekToMs) => {
    if (!isTimeInBufferedRange(getters, seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    commit('SET_OFFSET_MS', seekToMs);
    commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);
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
      commit('SET_OFFSET_MS', seekToMs);
      commit('SET_PLAYER_CURRENT_TIME_MS', seekToMs);

      const seekedPromise = new Promise((resolve) => {
        getters.GET_PLAYER_MEDIA_ELEMENT.addEventListener('seeked', (e) => {
          resolve(e.data);
        }, { once: true });
      });

      return timeoutPromise(seekedPromise, 15000);
    }
  },

  START_PERIODIC_PLEX_TIMELINE_UPDATE: async ({ commit, dispatch, rootGetters }) => {
    commit('SET_PLEX_TIMELINE_UPDATER_CANCELER', cancelablePeriodicTask(
      () => dispatch('SEND_PLEX_TIMELINE_UPDATE').catch(console.log),
      () => rootGetters.GET_CONFIG.slplayer_plex_timeline_update_interval,
    ));
  },

  START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: ({ commit, dispatch, rootGetters }) => {
    commit('SET_PLAYER_CONTROLS_SHOWN_INTERVAL', setInterval(async () => {
      commit('UPDATE_PLAYER_CONTROLS_SHOWN', await dispatch('FETCH_ARE_PLAYER_CONTROLS_SHOWN'));
    }, rootGetters.slplayer_controls_visible_checker_interval));
  },

  CHANGE_PLAYER_STATE: async ({ commit, dispatch }, state) => {
    commit('SET_PLAYER_STATE', state);
    const plexTimelineUpdatePromise = dispatch('SEND_PLEX_TIMELINE_UPDATE');
    await dispatch('synclounge/SEND_PLAYER_STATE_UPDATE', null, { root: true });
    await plexTimelineUpdatePromise;
  },

  LOAD_PLAYER_SRC: async ({ getters, commit }) => {
    // TODO: potentailly unload if already loaded to avoid load interrupted errors
    // However, while its loading, potentially   reporting the old time...
    try {
      const result = await getters.GET_PLAYER.load(getters.GET_SRC_URL);

      if (getters.GET_OFFSET_MS > 0) {
        commit('SET_PLAYER_CURRENT_TIME_MS', getters.GET_OFFSET_MS);
      }

      return result;
    } catch (e) {
      // Ignore 7000 error (load interrupted)
      if (e.code !== 7000) {
        throw e;
      }
    }

    return false;
  },

  INIT_PLAYER_STATE: async ({ rootGetters, commit, dispatch }) => {
    await dispatch('REGISTER_PLAYER_EVENTS');
    await dispatch('CHANGE_PLAYER_SRC');

    commit('SET_PLAYER_VOLUME', rootGetters['settings/GET_SLPLAYERVOLUME']);

    await dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');
    await dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
  },

  DESTROY_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    await dispatch('UNREGISTER_PLAYER_EVENTS');

    getters.GET_PLEX_TIMELINE_UPDATER_CANCELER();
    commit('SET_PLEX_TIMELINE_UPDATER_CANCELER', null);

    commit('plexclients/SET_ACTIVE_MEDIA_METADATA', null, { root: true });
    commit('plexclients/SET_ACTIVE_SERVER_ID', null, { root: true });
    // Leaving play queue around for possible upnext
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

  PLAY_PAUSE_VIDEO: async ({ getters, dispatch }) => {
    if (!getPlayerDurationMs(getters)) {
      // Can't play yet.  Ignore.
      return;
    }

    getters.GET_PLAYER.cancelTrickPlay();

    if (getters.IS_PLAYER_PAUSED()) {
      await dispatch('PRESS_PLAY');
    } else {
      await dispatch('PRESS_PAUSE');
    }
  },

  SEND_PARTY_PLAY_PAUSE: async ({ dispatch, getters }) => {
    // If the player was actually paused (and not just paused for seeking)
    await dispatch('synclounge/sendPartyPause', getters.IS_PLAYER_PAUSED(), { root: true });
  },

  PLAY_NEXT: async ({ dispatch, commit }) => {
    commit('plexclients/INCREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_PREVIOUS: async ({ dispatch, commit }) => {
    commit('plexclients/DECREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM: async ({ dispatch, commit, rootGetters }) => {
    await dispatch('plexclients/UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM', null, { root: true });

    // Assume same server machineIdentifier, but this may not always be okay to do. (TODO: figure it out)

    // TODO: maybe plex indicates ongoing media index?
    commit('SET_MEDIA_INDEX', 0);
    commit('SET_OFFSET_MS', rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].viewOffset || 0);

    await dispatch('CHANGE_PLAYER_SRC');

    await dispatch('plexclients/UPDATE_ACTIVE_PLAY_QUEUE', null, { root: true });
  },
};
