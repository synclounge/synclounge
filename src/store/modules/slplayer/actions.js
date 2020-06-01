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
      params: getters.GET_ALL_PARAMS,
    });
    commit('SET_PLEX_DECISION', data);
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, maxVideoBitrate) => {
    // TODO: save to localStore persistently
    commit('SET_MAX_VIDEO_BITRATE', maxVideoBitrate);
    return dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_AUDIO_STREAM: async ({ getters, commit, dispatch }, audioStreamID) => {
    commit('SET_AUDIO_STREAM_ID', audioStreamID);

    // Send put
    await axios.put(getters.GET_AUDIO_STREAM_CHANGE_URL);

    // Redo src
    return dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, commit, dispatch }, subtitleStreamID) => {
    commit('SET_SUBTITLE_STREAM_ID', subtitleStreamID);


    // TODO: investigate if I really need to do this if the subtitles aren't burned

    // Send put
    await axios.put(getters.GET_SUBTITLE_STREAM_CHANGE_URL);

    // Redo src
    return dispatch('CHANGE_PLAYER_SRC');
  },

  FETCH_METADATA: async ({ commit, getters }) => {
    const result = await getters.GET_PLEX_SERVER.getMediaByRatingKey(getters.GET_RATING_KEY);
    // Always media 0

    commit('SET_METADATA', result.MediaContainer.Metadata[0]);
    return true;
  },

  CHANGE_MEDIA_INDEX: () => {

  },

  CHANGE_PLAYER_SRC: async ({ getters, commit, dispatch }) => {
    commit('SET_SESSION', generateGuid());
    await dispatch('SEND_PLEX_DECISION_REQUEST');
    getters.GET_PLAYER.src(getters.GET_SRC_URL);
  },

  SEND_PLEX_TIMELINE_UPDATE: ({ getters }) => axios.get(getters.GET_TIMELINE_URL, {
    params: {
      hasMDE: 1,
      ratingKey: getters.GET_RATING_KEY,
      key: getters.GET_KEY,
      state: getters.GET_PLAYER_STATE,
      time: Math.floor(getters.GET_PLAYER.currentTime() * 1000),
      duration: Math.floor(getters.GET_PLAYER.duration() * 1000),
      ...getters.GET_BASE_PARAMS,
    },
    timeout: 10000,
  }),

  HANDLE_PLAYER_PLAYING: ({ commit }) => {
    commit('SET_PLAYER_STATE', 'playing');
  },

  HANDLE_PLAYER_PAUSE: ({ commit }) => {
    commit('SET_PLAYER_STATE', 'paused');
  },

  HANDLE_PLAYER_SEEKING: ({ commit }) => {
    commit('SET_PLAYER_STATE', 'buffering');
  },

  HANDLE_PLAYER_SEEKED: ({ getters, commit }) => {
    commit('SET_PLAYER_STATE', getters.GET_PLAYER.paused() ? 'paused' : 'playing');
  },

  HANDLE_PLAYER_WAITING: ({ commit }) => {
    commit('SET_PLAYER_STATE', 'buffering');
  },

  HANDLE_PLAYER_VOLUME_CHANGE: ({ getters, commit }) => {
    commit('setSetting', ['PTPLAYERVOLUME', getters.GET_PLAYER.volume() || 0], { root: true });
  },


  // Command handlers
  HANDLE_COMMAND: ({ dispatch }, { command, params, callback }) => {
    dispatch('DO_COMMAND_DISPATCH', { action: commandActions(command), params }).then(callback);
  },

  DO_COMMAND_DISPATCH: async ({ dispatch }, { action, params }) =>
    dispatch(action, params),

  DO_COMMAND_POLL: ({ getters }) => getters.GET_POLL_RESPONSE,

  DO_COMMAND_PLAY: ({ getters }) => {
    if (getters.GET_PLAYER_STATE !== 'playing') {
      getters.GET_PLAYER.play();
    }
  },

  DO_COMMAND_PAUSE: ({ getters }) => {
    if (getters.GET_PLAYER_STATE !== 'paused') {
      getters.GET_PLAYER.pause();
    }
  },

  DO_COMMAND_PLAY_MEDIA: ({ commit }, {
    offset, machineIdentifier, mediaIndex, key,
  }) => {
    commit('SET_PLEX_SERVER_ID', machineIdentifier);
    commit('SET_RATING_KEY', key.replace('/library/metadata/', ''));
    commit('SET_MEDIA_INDEX', mediaIndex);
    commit('SET_OFFSET', offset);
  },

  DO_COMMAND_STOP: ({ getters }, { callback }) => {
    this.chosenKey = null;
    this.chosenServer = null;
    this.playerduration = null;
    this.playertime = 0;
    this.playingMetadata = null;
    this.$router.push('/browse');
    return data.callback(true);
  },

  DO_COMMAND_SEEK_TO: async ({ getters, dispatch }, { offset: seekToMs, softSeek }) => {
    console.log('Seeking: ', seekToMs);
    console.log('Currentime: ', getters.GET_PLAYER_CURRENT_TIME_MS);

    if (Number.isNaN(getters.GET_PLAYER_DURATION_MS())) {
      throw new Error('Player is not ready');
    }

    if (softSeek) {
      return dispatch('SOFT_SEEK', seekToMs);
    }

    return dispatch('NORMAL_SEEK', seekToMs);
  },

  SOFT_SEEK: ({ getters }, seekToMs) => {
    if (!getters.IS_TIME_IN_BUFFERED_RANGE(seekToMs)) {
      throw new Error('Soft seek requested but not within buffered range');
    }

    getters.GET_PLAYER.currentTime(seekToMs / 1000);
    return true;
  },

  NORMAL_SEEK: async ({ getters, rootGetters }, seekToMs) => {
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
          getters.GET_PLAYER.playbackRate(1.0);
          throw new Error('Slow seek was stop due to buffering or pausing');
        }

        const delayPromise = delay(25);

        // 25 here because interval is 25ms
        const expectedHostTimeMs = seekToMs + (25 * iterations);

        const difference = expectedHostTimeMs - getters.GET_PLAYER_CURRENT_TIME_MS;
        const absDifference = Math.abs(difference);

        if (absDifference < 30) {
          getters.GET_PLAYER.playbackRate(1.0);
          return true;
        }

        if (absDifference > 5000) {
          getters.GET_PLAYER.playbackRate(1.0);
          throw new Error('Slow seek was stopped as we are beyond 5000ms');
        }

        if (difference > 0) {
          if (getters.GET_PLAYER.playbackRate() < 1.02) {
            // Speed up
            getters.GET_PLAYER.playbackRate(getters.GET_PLAYER.playbackRate() + 0.0001);
          }
        } else if (getters.GET_PLAYER.playbackRate() > 0.98) {
          // Slow down
          getters.GET_PLAYER.playbackRate(getters.GET_PLAYER.playbackRate() - 0.0001);
        }

        // eslint-disable-next-line no-await-in-loop
        await delayPromise;

        iterations += 1;
      }
    } else {
      getters.GET_PLAYER.currentTime(seekToMs / 1000);

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
      if (!getters.GET_METADATA) {
        return true;
      }

      const delayPromise = delay(10000);
      // eslint-disable-next-line no-await-in-loop
      await dispatch('SEND_PLEX_TIMELINE_UPDATE').catch(e => e);
      // eslint-disable-next-line no-await-in-loop
      await delayPromise;
    }
  },
};
