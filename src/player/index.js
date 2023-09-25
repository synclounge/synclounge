import {
  getPlayer, setPlayer, getOverlay, setOverlay,
} from './state';

let cachedDuration = 0;

// eslint-disable-next-line no-underscore-dangle
export const areControlsShown = () => !getOverlay() || (getOverlay()?.getControls().enabled_
    && (getOverlay()?.getControls().getControlsContainer().getAttribute('shown') != null
      || getOverlay()?.getControls().getControlsContainer().getAttribute('casting') != null));

export const getControlsOffset = (fallbackHeight) => (getPlayer()?.getMediaElement()?.offsetHeight
  || fallbackHeight) * 0.025 + 48 || 0;

export const getControlsOffsetWithVisibility = (fallbackHeight) => (areControlsShown()
  ? getControlsOffset(fallbackHeight) : 0);

export const isPaused = () => getPlayer()?.getMediaElement()?.paused;

export const isPresentationPaused = () => isPaused() && !getOverlay().getControls().isSeeking();

export const isBuffering = () => getPlayer()?.isBuffering();

export const isPlaying = () => !isPaused() && !isBuffering();

export const getCurrentTime = () => getPlayer()?.getMediaElement().currentTime;

export const getCurrentTimeMs = () => (getPlayer()?.getMediaElement().currentTime ?? 0) * 1000;

export const getDurationMs = () => {
  const { duration } = getPlayer().getMediaElement();
  if (!Number.isNaN(duration)) {
    cachedDuration = duration * 1000;
  }
  return cachedDuration;
};

export const getVolume = () => getPlayer().getMediaElement().volume;

export const setVolume = (volume) => {
  getPlayer().getMediaElement().volume = volume;
};

export const play = () => getPlayer().getMediaElement().play();
export const pause = () => getPlayer().getMediaElement().pause();

export const isTimeInBufferedRange = (timeMs) => {
  const bufferedTimeRange = getPlayer().getMediaElement().buffered;

  // There can be multiple ranges
  for (let i = 0; i < bufferedTimeRange.length; i += 1) {
    if (timeMs >= bufferedTimeRange.start(i) * 1000 && timeMs <= bufferedTimeRange.end(i) * 1000) {
      return true;
    }
  }

  return false;
};

export const isMediaElementAttached = () => getPlayer()?.getMediaElement != null;

export const addEventListener = (...args) => getPlayer().addEventListener(...args);

export const removeEventListener = (...args) => getPlayer().removeEventListener(...args);

const addMediaElementEventListener = (...args) => getPlayer()
  .getMediaElement()
  .addEventListener(...args);

const removeMediaElementEventListener = (...args) => getPlayer()
  .getMediaElement()
  .removeEventListener(...args);

// TODO: potentialy make cancellable
export const waitForMediaElementEvent = ({ signal, type }) => new Promise((resolve, reject) => {
  signal.pr.catch((e) => {
    removeMediaElementEventListener(type, resolve);
    reject(e);
  });

  addMediaElementEventListener(type, resolve, { once: true });
});

export const cancelTrickPlay = () => getPlayer().cancelTrickPlay();

export const load = (...args) => getPlayer().load(...args);

export const unload = (...args) => getPlayer().unload(...args);

export const getPlaybackRate = () => getPlayer().getPlaybackRate();

export const setPlaybackRate = (rate) => {
  getPlayer().getMediaElement().playbackRate = rate;
};

export const setCurrentTimeMs = (timeMs) => {
  getPlayer().getMediaElement().currentTime = timeMs / 1000;
};

export const getSmallPlayButton = () => getOverlay()
  .getControls()
  .getControlsContainer()
  .getElementsByClassName('shaka-small-play-button')[0];

export const getBigPlayButton = () => getOverlay().getControls().getControlsContainer()
  .getElementsByClassName('shaka-play-button')[0];

export const getDimensions = () => {
  const {
    videoWidth, videoHeight, offsetWidth, offsetHeight,
  } = getPlayer().getMediaElement();

  return {
    videoWidth,
    videoHeight,
    offsetWidth,
    offsetHeight,
  };
};

export const insertElementBeforeVideo = (element) => {
  const parent = getPlayer().getMediaElement().parentNode;

  parent.insertBefore(element, getPlayer().getMediaElement());
};

export const getMediaElement = () => getPlayer().getMediaElement();

export const destroy = async () => {
  const savedOverlay = getOverlay();
  setPlayer(null);
  setOverlay(null);
  await savedOverlay.destroy();
};
