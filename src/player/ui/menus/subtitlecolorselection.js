import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import {
  setDisplay, getDescendantIfExists, removeAllChildren, focusOnTheChosenItem, checkmarkIcon,
} from '@/player/ui/utils';
import { subtitleColors } from '@/utils/subtitleutils';

export default (store) => {
  class SubtitleColorSelection extends shaka.ui.SettingsMenu {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls, 'color_lens');

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['slplayer/IS_USING_NATIVE_SUBTITLES'],
          this.updateSubtitleColorSelection.bind(this),
        ),

        store.watch(
          (state, getters) => getters['slplayer/GET_SUBTITLE_COLOR'],
          this.updateSubtitleColorSelection.bind(this),
        ),
      ];

      this.button.classList.add('shaka-subtitle-color-button');
      this.menu.classList.add('shaka-subtitle-color');

      this.backSpan.textContent = 'Subtitle Color';
      this.nameSpan.textContent = 'Subtitle Color';

      this.updateSubtitleColorSelection();
    }

    updateSubtitleColorSelection() {
      // Hide menu if there is nothing to choose or burning subtitles
      if (Object.keys(subtitleColors).length <= 1
        || !store.getters['slplayer/IS_USING_NATIVE_SUBTITLES']) {
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

      this.addSubtitleColorSelection();

      focusOnTheChosenItem(this.menu);
    }

    addSubtitleColorSelection() {
      Object.entries(subtitleColors).forEach(([name, color]) => {
        const button = document.createElement('button');
        button.classList.add('explicit-subtitle-color');

        const span = document.createElement('span');
        span.textContent = name;
        button.appendChild(span);

        this.eventManager.listen(
          button,
          'click',
          () => this.onSubtitleColorClicked(color),
        );

        if (color === store.getters['slplayer/GET_SUBTITLE_COLOR']) {
          button.setAttribute('aria-selected', 'true');
          button.appendChild(checkmarkIcon());
          span.classList.add('shaka-chosen-item');
          this.currentSelection.textContent = span.textContent;
        }

        this.menu.appendChild(button);
      });
    }

    static onSubtitleColorClicked(color) {
      store.dispatch('slplayer/CHANGE_SUBTITLE_COLOR', color);
    }

    release() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.release();
    }
  }

  const factory = {
    create: (rootElement, controls) => new SubtitleColorSelection(rootElement, controls),
  };

  shaka.ui.OverflowMenu.registerElement('subtitlecolor', factory);
};
