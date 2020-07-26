import libjass from 'libjass';

import { queryFetch } from '@/utils/fetchutils';

libjass.debugMode = true;

let player = null;
let overlay = null;
let videoClock = null;
let subtitleRenderer = null;

const settings = {

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
    videoClock._eventListeners.clear();
  }

  if (subtitleRenderer) {
    subtitleRenderer.libjassSubsWrapper.remove();
    subtitleRenderer = null;
  }
};

const getOrMakeVideoClock = () => {
  if (!videoClock) {
    videoClock = new libjass.renderers.VideoClock(getPlayer().getMediaElement());
  }

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

export const setSubtitleUrl = async (subUrl) => {
  const response = await queryFetch(subUrl);
  const parser = new libjass.parser.StreamParser(new libjass.parser.BrowserReadableStream(response.body, 'utf-8'));
  const ass = await parser.minimalASS;

  initRenderer(ass);
};

export const disposeSubtitles = () => {
  cleanupSubtitlesWrapper();
  videoClock = null;
};
