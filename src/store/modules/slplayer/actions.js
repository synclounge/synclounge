import { CAF } from 'caf';

import { getRandomPlexId } from '@/utils/random';
import { fetchJson, queryFetch } from '@/utils/fetchutils';
import {
  play, pause, getDurationMs, getCurrentTimeMs, isTimeInBufferedRange,
  isMediaElementAttached, isPlaying, isPresentationPaused, isBuffering, getVolume, isPaused,
  waitForMediaElementEvent, destroy, cancelTrickPlay, load, setPlaybackRate, getPlaybackRate,
  setCurrentTimeMs, setVolume, addEventListener, removeEventListener, areControlsShown,
  getSmallPlayButton, getBigPlayButton, unload,
} from '@/player';
import Deferred from '@/utils/deferredpromise';
import subtitleActions from './subtitleActions';

export default {
  MAKE_TIMELINE_PARAMS: async ({ getters, rootGetters, dispatch }) => ({
    ratingKey: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].ratingKey,
    key: rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA'].key,
    // playbackTime: 591
    playQueueItemID: rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].playQueueItemID,
    state: getters.GET_PLAYER_STATE,
    hasMDE: 1,
    time: Math.floor(await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK')),
    duration: Math.floor(getDurationMs()),
    'X-Plex-Session-Identifier': getters.GET_X_PLEX_SESSION_ID,
    ...getters.GET_PART_PARAMS,
  }),

  FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK: ({ getters }) => (getters.GET_MASK_PLAYER_STATE
    ? getters.GET_OFFSET_MS
    : getCurrentTimeMs() || getters.GET_OFFSET_MS),

  SEND_PLEX_DECISION_REQUEST: async ({ getters, commit }) => {
    const data = await fetchJson(getters.GET_DECISION_URL, getters.GET_DECISION_AND_START_PARAMS);
    commit('SET_PLEX_DECISION', data);
    commit('SET_SUBTITLE_OFFSET', parseInt(getters.GET_SUBTITLE_STREAM?.offset || 0, 10));
  },

  CHANGE_MAX_VIDEO_BITRATE: async ({ commit, dispatch }, bitrate) => {
    commit('settings/SET_SLPLAYERQUALITY', bitrate, { root: true });
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_AUDIO_STREAM: async ({ getters, dispatch }, audioStreamID) => {
    await queryFetch(getters.GET_PART_URL, {
      audioStreamID,
      ...getters.GET_PART_PARAMS,
    }, { method: 'PUT' });

    await dispatch('plexclients/RELOAD_ACTIVE_MEDIA_METADATA', null, { root: true });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_SUBTITLE_STREAM: async ({ getters, dispatch }, subtitleStreamID) => {
    await queryFetch(getters.GET_PART_URL, {
      subtitleStreamID,
      ...getters.GET_PART_PARAMS,
    }, { method: 'PUT' });

    await dispatch('plexclients/RELOAD_ACTIVE_MEDIA_METADATA', null, { root: true });

    // Redo src
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  CHANGE_MEDIA_INDEX: async ({ commit, dispatch }, index) => {
    commit('SET_MEDIA_INDEX', index);
    await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  // Changes the player src to the new one and restores the time afterwards
  UPDATE_PLAYER_SRC_AND_KEEP_TIME: async ({ commit, dispatch }) => {
    commit('SET_OFFSET_MS', await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK'));
    await dispatch('CHANGE_PLAYER_SRC');
  },

  CHANGE_SUBTITLES: async ({ getters, dispatch }) => {
    if (getters.IS_USING_NATIVE_SUBTITLES) {
      await dispatch('SET_SUBTITLE_URL');
    } else {
      await dispatch('DESTROY_ASS');
    }
  },

  CHANGE_PLAYER_SRC: async ({ getters, commit, dispatch }) => {
    console.debug('CHANGE_PLAYER_SRC');

    // Abort subtitle requests now or else we get ugly errors from the server closing it.
    await dispatch('DESTROY_ASS');

    if (getters.GET_FORCE_TRANSCODE_RETRY) {
      commit('SET_FORCE_TRANSCODE_RETRY', false);
    }

    commit('SET_SESSION', getRandomPlexId());

    try {
      await dispatch('SEND_PLEX_DECISION_REQUEST');
      await dispatch('LOAD_PLAYER_SRC');
    } catch (e) {
      if (getters.GET_FORCE_TRANSCODE) {
        throw e;
      }
      console.warn('Error loading stream from plex. Retrying with forced transcoding', e);

      // Try again with forced transcoding
      commit('SET_FORCE_TRANSCODE_RETRY', true);
      await dispatch('SEND_PLEX_DECISION_REQUEST');
      await dispatch('LOAD_PLAYER_SRC');
    }

    await dispatch('CHANGE_SUBTITLES');

    // TODO: potentially avoid sending updates on media change since we already do that
    if (getters.GET_MASK_PLAYER_STATE) {
      commit('SET_MASK_PLAYER_STATE', false);
    }
  },

  SEND_PLEX_TIMELINE_UPDATE: async (
    { getters, dispatch },
    { signal, ...extraParams } = {},
  ) => queryFetch(
    getters.GET_TIMELINE_URL,
    {
      ...await dispatch('MAKE_TIMELINE_PARAMS'),
      ...(extraParams.state !== undefined && { state: extraParams.state }),
      ...(extraParams.continuing !== undefined && { continuing: extraParams.continuing }),
    },
    { signal },
  ),

  FETCH_TIMELINE_POLL_DATA: async ({ getters, dispatch }) => (isMediaElementAttached()
    ? {
      time: await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK'),
      duration: getDurationMs(),
      playbackRate: getPlaybackRate(),
      state: getters.GET_PLAYER_STATE,
    }
    : {
      time: getters.GET_OFFSET_MS,
      duration: 0,
      playbackRate: 0,
      state: getters.GET_PLAYER_STATE,
    }),

  HANDLE_PLAYER_PLAYING: async ({ dispatch }) => {
    if (isPlaying()) {
      await dispatch('CHANGE_PLAYER_STATE', 'playing');
    }
  },

  HANDLE_PLAYER_PAUSE: async ({ getters, dispatch }) => {
    if (isBuffering()) {
      // If we are buffering, then we don't need to actually change the state, but we should send
      // out a new state update to synclounge since we have seeked

      // Wait for seeking since time isn't updated until we get that event
      dispatch('PROCESS_STATE_UPDATE_ON_PLAYER_EVENT', {
        type: 'seeking',
        signal: getters.GET_PLAYER_DESTROY_CANCEL_TOKEN.signal,
      });
      await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', null, { root: true });
    } else if (isPresentationPaused()) {
      await dispatch('CHANGE_PLAYER_STATE', 'paused');
    }
  },

  HANDLE_PLAYER_BUFFERING: async ({ dispatch }, event) => {
    if (event.buffering) {
      await dispatch('CHANGE_PLAYER_STATE', 'buffering');
    } else {
      // Report back if player is playing
      await dispatch('CHANGE_PLAYER_STATE', isPaused() ? 'paused' : 'playing');
    }
  },

  HANDLE_PLAYER_VOLUME_CHANGE: ({ commit }) => {
    commit('settings/SET_SLPLAYERVOLUME', getVolume(), { root: true });
  },

  HANDLE_PLAYER_CLICK: async ({ dispatch }, e) => {
    if (!e.target.classList.contains('shaka-close-button')) {
      await dispatch('SEND_PARTY_PLAY_PAUSE');
    }
  },

  HANDLE_SEEKING: async ({ dispatch }) => {
    console.debug('HANDLE_SEEKING');
    await dispatch('DESTROY_ASS');
  },

  HANDLE_SEEKED: async ({ dispatch }) => {
    console.debug('HANDLE_SEEKED');
    await dispatch('CHANGE_SUBTITLES');
  },

  HANDLE_PICTURE_IN_PICTURE_CHANGE: async ({ getters, commit, dispatch }) => {
    commit('SET_IS_IN_PICTURE_IN_PICTURE', document.pictureInPictureElement != null);
    if (getters.IS_IN_PICTURE_IN_PICTURE && getters.IS_USING_NATIVE_SUBTITLES) {
      // If we are in picture and picture, we must burn subtitles
      // Redo src
      await dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
    }
  },

  HANDLE_ERROR: ({ dispatch }, e) => {
    console.error(e);
    // Restart source
    return dispatch('UPDATE_PLAYER_SRC_AND_KEEP_TIME');
  },

  PRESS_PLAY: () => {
    play();
  },

  PRESS_PAUSE: () => {
    pause();
  },

  PRESS_STOP: async ({ dispatch }) => {
    await dispatch('CHANGE_PLAYER_STATE', 'stopped');
  },

  SOFT_SEEK: ({ commit }, seekToMs) => {
    console.debug('SOFT_SEEK', seekToMs);
    if (!isTimeInBufferedRange(seekToMs)) {
      throw new Error('Soft seek not allowed outside of buffered range');
    }

    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);
  },

  PROCESS_STATE_UPDATE_ON_PLAYER_EVENT: async ({ dispatch }, { signal, type, noSync }) => {
    await waitForMediaElementEvent({ signal, type });
    await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', noSync, { root: true });
  },

  SPEED_SEEK: async ({ dispatch, rootGetters }, { cancelSignal, seekToMs }) => {
    console.debug('SPEED_SEEK', seekToMs);
    const currentTimeMs = await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK');
    const difference = seekToMs - currentTimeMs;
    const rate = 1 + (Math.sign(difference) * rootGetters.GET_CONFIG.slplayer_speed_sync_rate);
    const timeUntilSynced = (seekToMs - currentTimeMs) / (rate - 1);
    console.log('ms until synced: ', timeUntilSynced);

    const main = CAF(function* main(signal) {
      setPlaybackRate(rate);

      try {
        yield Promise.all([
          CAF.delay(signal, timeUntilSynced),

          dispatch('PROCESS_STATE_UPDATE_ON_PLAYER_EVENT', {
            signal,
            type: 'ratechange',
            noSync: true,
          }),
        ]);
      } finally {
        setPlaybackRate(1);

        // TODO: not sure what to do since I need to do this cancellable task in the cleanup
        dispatch('PROCESS_STATE_UPDATE_ON_PLAYER_EVENT', {
          signal,
          type: 'ratechange',
          // Don't sync if aborted
          noSync: signal.aborted,
        });
      }
    });

    return main(cancelSignal);
  },

  NORMAL_SEEK: async ({ rootGetters, commit }, { cancelSignal, seekToMs }) => {
    console.debug('NORMAL_SEEK', seekToMs);
    commit('SET_OFFSET_MS', seekToMs);
    setCurrentTimeMs(seekToMs);

    const timeoutToken = CAF.timeout(
      rootGetters.GET_CONFIG.slplayer_seek_timeout,
      'Normal seek took too long',
    );

    const anySignal = CAF.signalRace([
      cancelSignal,
      timeoutToken.signal,
    ]);

    const main = CAF(function* main(signal) {
      yield waitForMediaElementEvent({ signal, type: 'seeked' });
    });

    try {
      await main(anySignal);
    } finally {
      timeoutToken.abort();
    }
  },

  SPEED_OR_NORMAL_SEEK: async ({ dispatch, getters, rootGetters }, { cancelSignal, seekToMs }) => {
    // TODO: maybe separate functino for skip ahead probably lol
    // TODO: rewrite this entirely.
    // TODO: check the logic here to make sense if the seek time is in the past ...

    // TODO: make sure this doesnt happen when buffering
    const currentTimeMs = await dispatch('FETCH_PLAYER_CURRENT_TIME_MS_OR_FALLBACK');
    const difference = seekToMs - currentTimeMs;
    if (Math.abs(difference) <= rootGetters.GET_CONFIG.slplayer_speed_sync_max_diff
        && getters.GET_PLAYER_STATE === 'playing') {
      return dispatch('SPEED_SEEK', { cancelSignal, seekToMs });
    }

    return dispatch('NORMAL_SEEK', { cancelSignal, seekToMs });
  },

  START_PERIODIC_PLEX_TIMELINE_UPDATE: async ({ commit, dispatch, rootGetters }) => {
    // eslint-disable-next-line new-cap
    const cancelToken = new CAF.cancelToken();

    commit('SET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN', cancelToken);

    const main = CAF(function* plexTimelineUpdater(signal) {
      while (true) {
        yield CAF.delay(signal, rootGetters.GET_CONFIG.slplayer_plex_timeline_update_interval);

        try {
          yield dispatch('SEND_PLEX_TIMELINE_UPDATE', signal);
        } catch (e) {
          console.error(e);
        }
      }
    });

    try {
      await main(cancelToken.signal);
    } catch (e) {
      console.debug('PLEX_TIMELINE_UPDATER canceled');
    }
  },

  START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL: ({ commit, rootGetters }) => {
    commit('SET_PLAYER_CONTROLS_SHOWN_INTERVAL', setInterval(() => {
      commit('UPDATE_PLAYER_CONTROLS_SHOWN', areControlsShown());
    }, rootGetters.GET_CONFIG.slplayer_controls_visible_checker_interval));
  },

  CHANGE_PLAYER_STATE: async ({ commit, dispatch }, state) => {
    console.debug('CHANGE_PLAYER_STATE', state);
    commit('SET_PLAYER_STATE', state);
    const plexTimelineUpdatePromise = dispatch('SEND_PLEX_TIMELINE_UPDATE');
    if (state !== 'stopped') {
      await dispatch('synclounge/PROCESS_PLAYER_STATE_UPDATE', null, { root: true });
    }

    await plexTimelineUpdatePromise;
  },

  LOAD_PLAYER_SRC: async ({ getters }) => {
    // TODO: potentailly unload if already loaded to avoid load interrupted errors
    // However, while its loading, potentially   reporting the old time...
    await unload();
    await load(getters.GET_SRC_URL);

    if (getters.GET_OFFSET_MS > 0) {
      setCurrentTimeMs(getters.GET_OFFSET_MS);
    }
  },

  NAVIGATE_AND_INITIALIZE_PLAYER: ({ commit }) => {
    console.debug('NAVIGATE_AND_INITIALIZE_PLAYER');
    // I don't really like this. I'd rather have the player be part of the main app rather than a
    // vue route
    // TODO: above

    // TODO: this is bad practice, so if you know a better way...
    const deferred = Deferred();

    commit('SET_PLAYER_INITIALIZED_DEFERRED_PROMISE', deferred);
    commit('SET_NAVIGATE_TO_PLAYER', true, { root: true });

    return deferred.promise;
  },

  INIT_PLAYER_STATE: async ({
    getters, rootGetters, commit, dispatch,
  }) => {
    console.debug('INIT_PLAYER_STATE');

    // eslint-disable-next-line new-cap
    commit('SET_PLAYER_DESTROY_CANCEL_TOKEN', new CAF.cancelToken());
    try {
      await dispatch('REGISTER_PLAYER_EVENTS');
      await dispatch('START_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
      setVolume(rootGetters['settings/GET_SLPLAYERVOLUME']);
      await dispatch('CHANGE_PLAYER_SRC');

      // Purposefully not awaited
      dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');
    } catch (e) {
      if (getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE) {
        // TODO: potentially close player
        getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE.reject(e);
        commit('SET_PLAYER_INITIALIZED_DEFERRED_PROMISE', null);
      }
    }

    if (getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE) {
      getters.GET_PLAYER_INITIALIZED_DEFERRED_PROMISE.resolve();
      commit('SET_PLAYER_INITIALIZED_DEFERRED_PROMISE', null);
    }

    commit('SET_IS_PLAYER_INITIALIZED', true);
  },

  CANCEL_PERIODIC_PLEX_TIMELINE_UPDATE: ({ getters, commit }) => {
    if (getters.GET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN) {
      getters.GET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN.abort();
      commit('SET_PLEX_TIMELINE_UPDATER_CANCEL_TOKEN', null);
    }
  },

  DESTROY_PLAYER_STATE: async ({ getters, commit, dispatch }) => {
    console.debug('DESTROY_PLAYER_STATE');
    getters.GET_PLAYER_DESTROY_CANCEL_TOKEN.abort();
    commit('SET_PLAYER_DESTROY_CANCEL_TOKEN', null);
    commit('SET_FORCE_TRANSCODE_RETRY', false);

    commit('STOP_UPDATE_PLAYER_CONTROLS_SHOWN_INTERVAL');
    commit('UPDATE_PLAYER_CONTROLS_SHOWN', false);
    await dispatch('UNREGISTER_PLAYER_EVENTS');
    await dispatch('CANCEL_PERIODIC_PLEX_TIMELINE_UPDATE');

    commit('plexclients/SET_ACTIVE_MEDIA_METADATA', null, { root: true });
    commit('plexclients/SET_ACTIVE_SERVER_ID', null, { root: true });
    // Leaving play queue around for possible upnext
    commit('SET_IS_PLAYER_INITIALIZED', false);
    commit('SET_IS_IN_PICTURE_IN_PICTURE', false);
    await dispatch('DESTROY_SUBTITLES');
    commit('SET_SUBTITLE_OFFSET', 0);
    await destroy();
    commit('SET_OFFSET_MS', 0);

    // Send out stop media update
    await dispatch('synclounge/PROCESS_MEDIA_UPDATE', null, { root: true });
  },

  REGISTER_PLAYER_EVENTS: ({ commit, dispatch }) => {
    const bufferingListener = (e) => dispatch('HANDLE_PLAYER_BUFFERING', e);
    addEventListener('buffering', bufferingListener);
    commit('SET_BUFFERING_EVENT_LISTENER', bufferingListener);

    const clickListener = (e) => dispatch('HANDLE_PLAYER_CLICK', e);
    getSmallPlayButton().addEventListener('click', clickListener);
    getBigPlayButton().addEventListener('click', clickListener);
    commit('SET_CLICK_EVENT_LISTENER', clickListener);

    const errorListener = (e) => dispatch('HANDLE_ERROR', e);
    addEventListener('error', errorListener);
    commit('SET_ERROR_EVENT_LISTENER', errorListener);
  },

  UNREGISTER_PLAYER_EVENTS: ({ getters, commit }) => {
    removeEventListener('buffering', getters.GET_BUFFERING_EVENT_LISTENER);
    commit('SET_BUFFERING_EVENT_LISTENER', null);

    getSmallPlayButton().removeEventListener('click', getters.GET_CLICK_EVENT_LISTENER);
    getBigPlayButton().removeEventListener('click', getters.GET_CLICK_EVENT_LISTENER);
    commit('SET_CLICK_EVENT_LISTENER', null);

    removeEventListener('buffering', getters.GET_ERROR_EVENT_LISTENER);
    commit('SET_ERROR_EVENT_LISTENER', null);
  },

  PLAY_PAUSE_VIDEO: async ({ dispatch }) => {
    // TODO: probably move into player file
    if (!getDurationMs()) {
      // Can't play yet.  Ignore.
      return;
    }

    cancelTrickPlay();

    if (isPresentationPaused()) {
      await dispatch('PRESS_PLAY');
    } else {
      await dispatch('PRESS_PAUSE');
    }
  },

  SEND_PARTY_PLAY_PAUSE: async ({ dispatch }) => {
    // If the player was actually paused (and not just paused for seeking)
    await dispatch('synclounge/sendPartyPause', isPresentationPaused(), { root: true });
  },

  PLAY_NEXT: async ({ dispatch, commit }) => {
    console.debug('slplayer/PLAY_NEXT');
    commit('plexclients/INCREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_PREVIOUS: async ({ dispatch, commit }) => {
    commit('plexclients/DECREMENT_ACTIVE_PLAY_QUEUE_SELECTED_ITEM_OFFSET', null, { root: true });
    await dispatch('PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM');
  },

  PLAY_ACTIVE_PLAY_QUEUE_SELECTED_ITEM: async ({ dispatch, commit, rootGetters }) => {
    await dispatch('CANCEL_PERIODIC_PLEX_TIMELINE_UPDATE');
    await dispatch('SEND_PLEX_TIMELINE_UPDATE', {
      state: 'stopped',
      continuing: 1,
    });

    await dispatch(
      'plexclients/UPDATE_STATE_FROM_ACTIVE_PLAY_QUEUE_SELECTED_ITEM',
      null,
      { root: true },
    );
    // TODO: maybe plex indicates ongoing media index?
    commit('SET_MEDIA_INDEX', 0);
    commit(
      'SET_OFFSET_MS',
      rootGetters['plexclients/GET_ACTIVE_PLAY_QUEUE_SELECTED_ITEM'].viewOffset || 0,
    );
    commit('SET_MASK_PLAYER_STATE', true);
    await dispatch('synclounge/PROCESS_MEDIA_UPDATE', true, { root: true });

    await dispatch('CHANGE_PLAYER_SRC');

    // Purposefully not awaited
    dispatch('START_PERIODIC_PLEX_TIMELINE_UPDATE');

    await dispatch('plexclients/UPDATE_ACTIVE_PLAY_QUEUE', null, { root: true });
  },

  SKIP_INTRO: async ({ dispatch, commit, rootGetters }) => {
    const introEnd = rootGetters['plexclients/GET_ACTIVE_MEDIA_METADATA_INTRO_MARKER']
      .endTimeOffset;
    console.debug('SKIP_INTRO', introEnd);
    await dispatch('DISPLAY_NOTIFICATION', {
      text: 'Skipping intro',
      color: 'info',
    }, { root: true });

    commit('SET_OFFSET_MS', introEnd);
    setCurrentTimeMs(introEnd);
  },

  ...subtitleActions,
};
