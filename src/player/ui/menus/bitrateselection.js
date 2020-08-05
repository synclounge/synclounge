import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import {
  setDisplay, getDescendantIfExists, removeAllChildren, focusOnTheChosenItem, checkmarkIcon,
} from '@/player/ui/utils';

export default (store) => {
  class BitrateSelection extends shaka.ui.SettingsMenu {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls, 'settings');

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['slplayer/GET_QUALITIES'],
          this.updateBitrateSelection.bind(this),
        ),

        store.watch(
          (state, getters) => getters['settings/GET_SLPLAYERQUALITY'],
          this.updateBitrateSelection.bind(this),
        ),
      ];

      this.button.classList.add('shaka-bitrate-button');
      this.menu.classList.add('shaka-bitrate');

      this.backSpan.textContent = 'Quality';
      this.nameSpan.textContent = 'Quality';

      this.updateBitrateSelection();
    }

    updateBitrateSelection() {
      // Hide menu if no bitrates
      if (store.getters['slplayer/GET_QUALITIES'].length <= 0) {
        setDisplay(this.menu, false);
        setDisplay(this.button, false);
        return;
      }

      // Otherwise, restore it.
      setDisplay(this.button, true);

      // Remove old shaka-resolutions
      // 1. Save the back to menu button
      const backButton = getDescendantIfExists(this.menu, 'shaka-back-to-overflow-button');

      // 2. Remove everything
      removeAllChildren(this.menu);

      // 3. Add the backTo Menu button back
      this.menu.appendChild(backButton);

      this.addBitrateSelection();

      focusOnTheChosenItem(this.menu);
    }

    addBitrateSelection() {
      store.getters['slplayer/GET_QUALITIES'].forEach((bitrateOption) => {
        const button = document.createElement('button');
        button.classList.add('explicit-bitrate');

        const span = document.createElement('span');
        span.textContent = bitrateOption.label;
        button.appendChild(span);

        this.eventManager.listen(
          button,
          'click',
          () => this.onBitrateClicked(bitrateOption.maxVideoBitrate),
        );

        if (bitrateOption.maxVideoBitrate === store.getters['settings/GET_SLPLAYERQUALITY']) {
          button.setAttribute('aria-selected', 'true');
          button.appendChild(checkmarkIcon());
          span.classList.add('shaka-chosen-item');
          this.currentSelection.textContent = span.textContent;
        }

        this.menu.appendChild(button);
      });
    }

    onBitrateClicked(bitrate) {
      store.dispatch('slplayer/CHANGE_MAX_VIDEO_BITRATE', bitrate);
    }

    release() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.release();
    }
  }

  const factory = {
    create: (rootElement, controls) => new BitrateSelection(rootElement, controls),
  };

  shaka.ui.OverflowMenu.registerElement('bitrate', factory);
};
