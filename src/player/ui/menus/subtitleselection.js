import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import {
  setDisplay, getDescendantIfExists, removeAllChildren, focusOnTheChosenItem, checkmarkIcon,
} from '@/player/ui/utils';

export default (store) => {
  class SubtitleSelection extends shaka.ui.SettingsMenu {
    #watcherCancellers = [];

    constructor(parent, controls) {
      super(parent, controls, 'subtitles');

      this.#watcherCancellers = [
        store.watch(
          (state, getters) => getters['slplayer/GET_SUBTITLE_STREAMS'],
          this.updateSubtitleSelection.bind(this),
        ),

        store.watch(
          (state, getters) => getters['slplayer/GET_SUBTITLE_STREAM_ID'],
          this.updateSubtitleSelection.bind(this),
        ),
      ];

      this.button.classList.add('shaka-subtitles-button');
      this.menu.classList.add('shaka-subtitles');

      this.backSpan.textContent = 'Subtitles';
      this.nameSpan.textContent = 'Subtitles';

      this.updateSubtitleSelection();
    }

    updateSubtitleSelection() {
      // Hide menu if there is only the None subtitle option
      if (store.getters['slplayer/GET_SUBTITLE_STREAMS'].length <= 1) {
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

      this.addSubtitleSelection();

      focusOnTheChosenItem(this.menu);
    }

    addSubtitleSelection() {
      store.getters['slplayer/GET_SUBTITLE_STREAMS'].forEach((subtitle) => {
        const button = document.createElement('button');
        button.classList.add('explicit-subtitle');

        const span = document.createElement('span');
        span.textContent = subtitle.text;
        button.appendChild(span);

        this.eventManager.listen(
          button,
          'click',
          () => this.onSubtitleClicked(subtitle.id),
        );

        if (subtitle.id === store.getters['slplayer/GET_SUBTITLE_STREAM_ID']) {
          button.setAttribute('aria-selected', 'true');
          button.appendChild(checkmarkIcon());
          span.classList.add('shaka-chosen-item');
          this.currentSelection.textContent = span.textContent;
        }

        this.menu.appendChild(button);
      });
    }

    static onSubtitleClicked(subtitleId) {
      store.dispatch('slplayer/CHANGE_SUBTITLE_STREAM', subtitleId);
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
    create: (rootElement, controls) => new SubtitleSelection(rootElement, controls),
  };

  shaka.ui.OverflowMenu.registerElement('subtitle', factory);
};
