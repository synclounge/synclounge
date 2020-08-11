import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import {
  setDisplay, getDescendantIfExists, removeAllChildren, focusOnTheChosenItem, checkmarkIcon,
} from '@/player/ui/utils';
import { subtitleSizes } from '@/utils/subtitleutils';

export default (store) => {
  class SubtitleSizeSelection extends shaka.ui.SettingsMenu {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls, 'format_size');

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['slplayer/IS_USING_NATIVE_SUBTITLES'],
          this.updateSubtitleSizeSelection.bind(this),
        ),

        store.watch(
          (state, getters) => getters['slplayer/GET_SUBTITLE_SIZE'],
          this.updateSubtitleSizeSelection.bind(this),
        ),
      ];

      this.button.classList.add('shaka-subtitle-size-button');
      this.menu.classList.add('shaka-subtitle-size');

      this.backSpan.textContent = 'Subtitle Size';
      this.nameSpan.textContent = 'Subtitle Size';

      this.updateSubtitleSizeSelection();
    }

    updateSubtitleSizeSelection() {
      // Hide menu if there is nothing to choose or burning subtitles
      if (Object.keys(subtitleSizes).length <= 1
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

      this.addSubtitleSizeSelection();

      focusOnTheChosenItem(this.menu);
    }

    addSubtitleSizeSelection() {
      Object.entries(subtitleSizes).forEach(([name, size]) => {
        const button = document.createElement('button');
        button.classList.add('explicit-subtitle-size');

        const span = document.createElement('span');
        span.textContent = name;
        button.appendChild(span);

        this.eventManager.listen(
          button,
          'click',
          () => SubtitleSizeSelection.onSubtitleSizeClicked(size),
        );

        if (size === store.getters['slplayer/GET_SUBTITLE_SIZE']) {
          button.setAttribute('aria-selected', 'true');
          button.appendChild(checkmarkIcon());
          span.classList.add('shaka-chosen-item');
          this.currentSelection.textContent = span.textContent;
        }

        this.menu.appendChild(button);
      });
    }

    static onSubtitleSizeClicked(size) {
      store.dispatch('slplayer/CHANGE_SUBTITLE_SIZE', size);
    }

    release() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.release();
    }
  }

  const factory = {
    create: (rootElement, controls) => new SubtitleSizeSelection(rootElement, controls),
  };

  shaka.ui.OverflowMenu.registerElement('subtitlesize', factory);
};
