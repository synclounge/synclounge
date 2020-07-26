import libjass from 'libjass';

import { makeUrl } from '@/utils/fetchutils';
import resiliantStreamFactory from './streams';

libjass.debugMode = true;

let player = null;
let overlay = null;
let videoClock = null;
let subtitleRenderer = null;

const settings = {
  preciseOutlines: true,
  preRenderTime: 20,
};

export const getPlayer = () => player;
export const setPlayer = (newPlayer) => {
  player = newPlayer;
};

export const getOverlay = () => overlay;
export const setOverlay = (newOverlay) => {
  overlay = newOverlay;
};

/**
 * Resize the subtitles to the dimensions of the video element.
 *
 * This method accounts for letterboxing if the video element's size is not the same ratio as the video resolution.
 */
export const resizeSubtitleContainer = () => {
  // Handle letterboxing around the video. If the width or height are greater than the video can be, then consider that dead space.
  if (!subtitleRenderer) {
    return;
  }

  const {
    videoWidth, videoHeight, offsetWidth, offsetHeight,
  } = getPlayer().getMediaElement();

  const ratio = Math.min(offsetWidth / videoWidth, offsetHeight / videoHeight);
  const subsWrapperWidth = videoWidth * ratio;
  const subsWrapperHeight = videoHeight * ratio;
  const subsWrapperLeft = (offsetWidth - subsWrapperWidth) / 2;
  const subsWrapperTop = (offsetHeight - subsWrapperHeight) / 2;

  subtitleRenderer.resize(subsWrapperWidth, subsWrapperHeight, subsWrapperLeft, subsWrapperTop);
};

export const cleanupSubtitlesWrapper = () => {
  if (videoClock) {
    // eslint-disable-next-line no-underscore-dangle
    videoClock._autoClock._manualClock._eventListeners.clear();
  }

  if (subtitleRenderer) {
    subtitleRenderer.libjassSubsWrapper.remove();
    subtitleRenderer = null;
  }
};

const getOrMakeVideoClock = () => {
  if (!videoClock) {
    console.log(getPlayer().getMediaElement().currentTime);
    videoClock = new libjass.renderers.VideoClock(getPlayer().getMediaElement());
  }

  window.clock = videoClock;

  return videoClock;
};

const initRenderer = (ass) => {
  subtitleRenderer = new libjass.renderers.WebRenderer(
    ass,
    getOrMakeVideoClock(),
    document.createElement('div'),
    settings,
  );

  const parent = getPlayer().getMediaElement().parentNode;

  parent.insertBefore(
    subtitleRenderer.libjassSubsWrapper,
    getPlayer().getMediaElement(),
  );

  resizeSubtitleContainer();
};

export const setSubtitleUrl = async (baseUrl, params) => {
  const stream = resiliantStreamFactory(makeUrl(baseUrl, params));
  const parser = new libjass.parser.StreamParser(stream);
  const ass = await parser.minimalASS;
  // console.log(ass);

  initRenderer(ass);
};

export const disposeSubtitles = () => {
  cleanupSubtitlesWrapper();
  videoClock = null;
};
