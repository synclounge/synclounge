import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import ShakaUtils from '@/player/ui/utils';

class MediaSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls, eventBus) {
    super(parent, controls, 'view_list');
    this.eventBus = eventBus;
    this.selectedMediaIndex = 0;
    this.mediaList = [];
    this.eventListeners = [
      {
        event: 'medialistchanged',
        fn: this.onMediaListChanged.bind(this),
      },
      {
        event: 'mediaindexchanged',
        fn: this.onMediaIndexChanged.bind(this),
      },	
    ];

    ShakaUtils.addEventListeners(this.eventListeners, this.eventBus);
    this.eventBus.$once(
      'slplayerdestroy',
      () => ShakaUtils.removeEventListeners(this.eventListeners, this.eventBus),
    );

    this.button.classList.add('shaka-media-button');
    this.menu.classList.add('shaka-media');

    this.backSpan.textContent = 'Version';
    this.nameSpan.textContent = 'Version';

    this.updateMediaSelection();
  }

  onMediaListChanged(streams) {
    this.mediaList = streams;
    this.updateMediaSelection();
  }

  onMediaIndexChanged(index) {
    if (index !== this.selectedMediaIndex) {
      this.selectedMediaIndex = index;
      this.updateMediaSelection();
    }
  }

  updateMediaSelection() {
    // Hide menu if there is only the one version
    if (this.mediaList.length <= 1) {
      ShakaUtils.setDisplay(this.menu, false);
      ShakaUtils.setDisplay(this.button, false);
      return;
    }

    // Otherwise, restore it.
    ShakaUtils.setDisplay(this.button, true);

    // Remove old shaka-resolutions
    // 1. Save the back to menu button
    const backButton = ShakaUtils.getFirstDescendantWithClassName(this.menu, 'shaka-back-to-overflow-button');

    // 2. Remove everything
    ShakaUtils.removeAllChildren(this.menu);

    // 3. Add the backTo Menu button back
    this.menu.appendChild(backButton);

    this.addMediaSelection();

    ShakaUtils.focusOnTheChosenItem(this.menu);
  }

  addMediaSelection() {
    this.mediaList.forEach((media) => {
      const button = document.createElement('button');
      button.classList.add('explicit-media');

      const span = document.createElement('span');
      span.textContent = media.text;
      button.appendChild(span);

      this.eventManager.listen(
        button,
        'click',
        () => this.onMediaClicked(media.index),
      );

      if (media.index === this.selectedMediaIndex) {
        button.setAttribute('aria-selected', 'true');
        button.appendChild(ShakaUtils.checkmarkIcon());
        span.classList.add('shaka-chosen-item');
        this.currentSelection.textContent = span.textContent;
      }

      this.menu.appendChild(button);
    });
  }

  onMediaClicked(index) {
    this.eventBus.$emit('mediaindexselectionchanged', index);
  }
};

class MediaSelectionFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  create(rootElement, controls) {
    return new MediaSelection(rootElement, controls, this.eventBus);
  }
};

export default MediaSelectionFactory;