import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import {
  setDisplay, getDescendantIfExists, removeAllChildren, focusOnTheChosenItem, checkmarkIcon,
} from '@/player/ui/utils';
import { subtitlePositions } from '@/utils/subtitleutils';

export default (store) => {
  class SubtitlePositionSelection extends shaka.ui.SettingsMenu {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls, 'swap_vert');

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['slplayer/IS_USING_NATIVE_SUBTITLES'],
          this.updateSubtitlePositionSelection.bind(this),
        ),

        store.watch(
          (state, getters) => getters['slplayer/GET_SUBTITLE_POSITION'],
          this.updateSubtitlePositionSelection.bind(this),
        ),
      ];

      this.button.classList.add('shaka-subtitle-position-button');
      this.menu.classList.add('shaka-subtitle-position');

      this.backSpan.textContent = 'Subtitle Position';
      this.nameSpan.textContent = 'Subtitle Position';

      this.updateSubtitlePositionSelection();
    }

    updateSubtitlePositionSelection() {
      // Hide menu if there is nothing to choose or burning subtitles
      if (Object.keys(subtitlePositions).length <= 1
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

      this.addSubtitlePositionSelection();

      focusOnTheChosenItem(this.menu);
    }

    addSubtitlePositionSelection() {
      Object.entries(subtitlePositions).forEach(([name, position]) => {
        const button = document.createElement('button');
        button.classList.add('explicit-subtitle-position');

        const span = document.createElement('span');
        span.textContent = name;
        button.appendChild(span);

        this.eventManager.listen(
          button,
          'click',
          () => SubtitlePositionSelection.onSubtitlePositionClicked(position),
        );

        if (position === store.getters['slplayer/GET_SUBTITLE_POSITION']) {
          button.setAttribute('aria-selected', 'true');
          button.appendChild(checkmarkIcon());
          span.classList.add('shaka-chosen-item');
          this.currentSelection.textContent = span.textContent;
        }

        this.menu.appendChild(button);
      });
    }

    static onSubtitlePositionClicked(position) {
      store.dispatch('slplayer/CHANGE_SUBTITLE_POSITION', position);
    }

    // TODO: replace this function name with "release" when upgrading to shaka 3
    destroy() {
      this.#watcherCancellers.forEach((canceller) => {
        canceller();
      });

      super.destroy();
    }
  }

  const factory = {
    create: (rootElement, controls) => new SubtitlePositionSelection(rootElement, controls),
  };

  shaka.ui.OverflowMenu.registerElement('subtitleposition', factory);
};
