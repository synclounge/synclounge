import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import '@/player/ui';

shaka.log.setLevel(shaka.log.Level.ERROR);
shaka.polyfill.installAll();

// TODO: maybe keep player around???? and just reattach it???????
let player = null;
let overlay = null;

export const initialize = async ({
  mediaElement, playerConfig, videoContainer, overlayConfig,
}) => {
  player = new shaka.Player();
  await player.attach(mediaElement, false);
  player.configure(playerConfig);

  overlay = new shaka.ui.Overlay(player, videoContainer, mediaElement);
  overlay.configure(overlayConfig);
};

export const isPaused = () => player.getMediaElement().paused;

export const isPresentationPaused = () => isPaused()
  && !overlay.getControls().isSeeking();

export const isBuffering = () => player.isBuffering();

export const isPlaying = () => !isPaused() && !isBuffering();

export const getCurrentTimeMs = () => player.getMediaElement().currentTime * 1000;

export const getDurationMs = () => player.getMediaElement().duration * 1000;

export const getVolume = () => player.getMediaElement().volume;

export const setVolume = (volume) => {
  player.getMediaElement().volume = volume;
};

export const play = () => player.getMediaElement().play();
export const pause = () => player.getMediaElement().pause();

// eslint-disable-next-line no-underscore-dangle
export const areControlsShown = () => overlay.getControls().enabled_
    && (overlay.getControls().getControlsContainer().getAttribute('shown') != null
    || overlay.getControls().getControlsContainer().getAttribute('casting') != null);

export const isTimeInBufferedRange = (timeMs) => {
  const bufferedTimeRange = player.getMediaElement().buffered;

  // There can be multiple ranges
  for (let i = 0; i < bufferedTimeRange.length; i += 1) {
    if (timeMs >= bufferedTimeRange.start(i) * 1000 && timeMs <= bufferedTimeRange.end(i) * 1000) {
      return true;
    }
  }

  return false;
};

export const isMediaElementAttached = () => player && player.getMediaElement != null;

export const addEventListener = (...args) => player.addEventListener(...args);

export const removeEventListener = (...args) => player.removeEventListener(...args);

const addMediaElementEventListener = (...args) => player.getMediaElement()
  .addEventListener(...args);

// TODO: potentialy make cancellable
export const waitForMediaElementEvent = (type) => new Promise((resolve) => {
  addMediaElementEventListener(type, resolve, { once: true });
});

export const cancelTrickPlay = () => player.cancelTrickPlay();

export const load = (...args) => player.load(...args);

export const getPlaybackRate = () => player.getPlaybackRate();

export const setPlaybackRate = (rate) => {
  player.getMediaElement().playbackRate = rate;
};

export const setCurrentTimeMs = (timeMs) => {
  player.getMediaElement().currentTime = timeMs / 1000;
};

// eslint-disable-next-line no-underscore-dangle
export const getSmallPlayButton = () => overlay.getControls().elements_
  .find((element) => element instanceof shaka.ui.SmallPlayButton).button;

// eslint-disable-next-line no-underscore-dangle
export const getBigPlayButton = () => overlay.getControls().playButton_.button;

export const destroy = () => overlay.destroy();
