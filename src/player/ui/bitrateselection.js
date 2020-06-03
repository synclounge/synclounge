import shaka from 'shaka-player/dist/shaka-player.ui.debug';

class BitrateSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls, bitrates, initialBitrate) {
    super(parent, controls, 'settings');
    this.bitrates = bitrates;
    this.initialBitrate = initialBitrate;

    this.button.classList.add('shaka-bitrate-button');
    this.menu.classList.add('shaka-bitrates');

    this.backSpan.textContent = 'Bitrate';
    this.nameSpan.textContent = 'Bitrate';

    this.addBitratesSelection();
  }

  addBitratesSelection() {
    this.bitrates.forEach((bitrate) => {
      const button = document.createElement('button');
      button.classList.add('explicit-resolution');

      const span = document.createElement('span');
      span.textContent = bitrate.label;
      button.appendChild(span);

      this.eventManager.listen(
        button,
        'click',
        () => this.onBitrateSelected(bitrate.maxVideoBitrate, button, span),
      );

      if (bitrate.maxVideoBitrate === this.initialBitrate) {
        // If abr is disabled, mark the selected track's resolution.
        this.selectBitrateElements(button, span);
      }
      this.menu.appendChild(button);
    });

    //shaka.ui.Utils.focusOnTheChosenItem(this.menu);
  }

  static checkmarkIcon() {
    const icon = document.createElement('i');
    icon.classList.add('material-icons');
    icon.classList.add('shaka-chosen-item');
    icon.textContent = 'done';
    // Screen reader should ignore icon text.
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  selectBitrateElements(button, span) {
    button.setAttribute('aria-selected', 'true');
    const icon = BitrateSelection.checkmarkIcon();
    button.appendChild(icon);
    span.classList.add('shaka-chosen-item');
    this.currentSelection.textContent = span.textContent;

    this.selectedBitrateElements = {
      button,
      span,
      icon,
    };
  }

  removeCurrentBitrateSelected() {
    this.selectedBitrateElements.button.removeAttribute('aria-selected');
    this.selectedBitrateElements.icon.remove();
    this.selectedBitrateElements.span.classList.remove('shaka-chosen-item');
  }

  onBitrateSelected(maxVideoBitrate, button, span) {
    this.removeCurrentBitrateSelected();
    this.selectBitrateElements(button, span);
    // this.controls.dispatchEvent(new shaka.util.FakeEvent('bitratechanged', maxVideoBitrate));
    // this.player.dispatchEvent(new Event('bitratechanged'));
    this.controls.controlsContainer_.parentElement.dispatchEvent(new CustomEvent('bitratechanged', {
      detail: maxVideoBitrate,
    }));

    console.log(this);
  }
};

class BitrateSelectionFactory {
  constructor(bitrates, initialBitrate) {
    this.bitrates = bitrates;
    this.initialBitrate = initialBitrate;
  }
  create(rootElement, controls) {
    return new BitrateSelection(rootElement, controls, this.bitrates, this.initialBitrate);
  }
};

export default BitrateSelectionFactory;