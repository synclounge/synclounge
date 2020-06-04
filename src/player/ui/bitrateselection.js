import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import ShakaUtils from '@/player/ui/utils';

class BitrateSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls, eventBus) {
    super(parent, controls, 'settings');
    this.eventBus = eventBus;
    this.selectedBitrate = 0;
    this.bitrates = [];
    this.eventListeners = [
      {
        event: 'bitrateschanged',
        fn: this.onBitratesChanged.bind(this),
      },
      {
        event: 'bitratechanged',
        fn: this.onBitrateChanged.bind(this),
      },
    ];

    ShakaUtils.addEventListeners(this.eventListeners, this.eventBus);
    this.eventBus.$once(
      'slplayerdestroy',
      () => ShakaUtils.removeEventListeners(this.eventListeners, this.eventBus),
    );

    this.button.classList.add('shaka-bitrate-button');
    this.menu.classList.add('shaka-bitrate');

    this.backSpan.textContent = 'Quality';
    this.nameSpan.textContent = 'Quality';

    this.updateBitrateSelection();
  }

  onBitratesChanged(streams) {
    this.bitrates = streams;
    this.updateBitrateSelection();
  }

  onBitrateChanged(id) {
    if (id !== this.selectedBitrate) {
      this.selectedBitrate = id;
      this.updateBitrateSelection();
    }
  }

  updateBitrateSelection() {
    // Hide menu if no bitrates
    if (this.bitrates.length <= 0) {
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

    this.addBitrateSelection();

    ShakaUtils.focusOnTheChosenItem(this.menu);
  }

  addBitrateSelection() {
    this.bitrates.forEach((bitrateOption) => {
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

      if (bitrateOption.maxVideoBitrate === this.selectedBitrate) {
        button.setAttribute('aria-selected', 'true');
        button.appendChild(ShakaUtils.checkmarkIcon());
        span.classList.add('shaka-chosen-item');
        this.currentSelection.textContent = span.textContent;
      }

      this.menu.appendChild(button);
    });
  }

  onBitrateClicked(bitrate) {
    this.eventBus.$emit('bitrateselectionchanged', bitrate);
  }
};

class BitrateSelectionFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  create(rootElement, controls) {
    return new BitrateSelection(rootElement, controls, this.eventBus);
  }
};

export default BitrateSelectionFactory;