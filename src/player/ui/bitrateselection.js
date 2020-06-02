import shaka from 'shaka-player/dist/shaka-player.ui';

class BitrateSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls) {
    super(parent, controls, shaka.ui.Enums.MaterialDesignIcons.RESOLUTION);

    this.config = this.controls.getConfig();

    this.button.classList.add('shaka-bitrate-button');
    this.menu.classList.add('shaka-bitrates');

    this.addBitratesSelection();
  }

  addBitratesSelection() {
    this.config.bitrates.forEach((bitrate) => {
      const button = shaka.util.Dom.createButton();
      button.classList.add('explicit-resolution');

      const span = shaka.util.Dom.createHTMLElement('span');
      span.textContent = bitrate.label;
      button.appendChild(span);

      this.eventManager.listen(
        button,
        'click',
        () => this.onBitrateSelected(bitrate.maxVideoBitrate, button, span)
      );

      if (bitrate.maxVideoBitrate === this.config.initialBitrate) {
        // If abr is disabled, mark the selected track's resolution.
        this.selectBitrateElements(button, span);
      }
      this.menu.appendChild(button);
    });

    shaka.ui.Utils.focusOnTheChosenItem(this.menu);
  }

  selectBitrateElements(button, span) {
    button.setAttribute('aria-selected', 'true');
    const icon = shaka.ui.Utils.checkmarkIcon();
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
    this.controls.dispatchEvent(new shaka.util.FakeEvent('bitratechanged', maxVideoBitrate));
  }

};

class BitrateSelectionFactory {
  create(rootElement, controls) {
    return new BitrateSelection(rootElement, controls);
  }
};

export default BitrateSelectionFactory;