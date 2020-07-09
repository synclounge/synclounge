import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import store from '@/store';
import playerUiPlugins from '@/player/ui';

import {
  getPlayer, setPlayer, getOverlay, setOverlay,
} from './state';

playerUiPlugins(store);

shaka.log.setLevel(shaka.log.Level.ERROR);
shaka.polyfill.installAll();

const initialize = async ({
  mediaElement, playerConfig, videoContainer, overlayConfig,
}) => {
  setPlayer(new shaka.Player());
  await getPlayer().attach(mediaElement, false);
  getPlayer().configure(playerConfig);

  setOverlay(new shaka.ui.Overlay(getPlayer(), videoContainer, mediaElement));
  getOverlay().configure(overlayConfig);
};

export default initialize;
