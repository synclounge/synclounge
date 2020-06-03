import shaka from 'shaka-player/dist/shaka-player.ui.debug';
import ShakaUtils from '@/player/ui/utils';

class SubtitleSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls, eventBus) {
    super(parent, controls, 'subtitles');
    this.eventBus = eventBus;
    this.selectedSubtitleId = 0;
    this.subtitleStreams = [];
    this.eventListeners = [
      {
        event: 'subtitlestreamschanged',
        fn: this.onSubtitleStreamsChanged.bind(this),
      },
      {
        event: 'subtitlestreamidchanged',
        fn: this.onSubtitleStreamIdChanged.bind(this),
      },
    ];

    ShakaUtils.addEventListeners(this.eventListeners, this.eventBus);
    this.eventBus.$once(
      'slplayerdestroy',
      () => ShakaUtils.removeEventListeners(this.eventListeners, this.eventBus),
    );

    this.button.classList.add('shaka-subtitles-button');
    this.menu.classList.add('shaka-subtitles');

    this.backSpan.textContent = 'Subtitles';
    this.nameSpan.textContent = 'Subtitles';

    this.updateSubtitleSelection();
  }

  onSubtitleStreamsChanged(streams) {
    console.log('subtitles changed');
    this.subtitleStreams = streams;
    this.updateSubtitleSelection();
  }

  onSubtitleStreamIdChanged(id) {
    console.log('id changed')
    if (id !== this.selectedSubtitleId) {
      this.selectedSubtitleId = id;
      this.updateSubtitleSelection();
    }
  }

  updateSubtitleSelection() {
    console.log(this.subtitleStreams);
    // Hide menu if no subtitles
    if (this.subtitleStreams.length <= 0) {
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

    this.addSubtitleSelection();

    ShakaUtils.focusOnTheChosenItem(this.menu);
  }

  addSubtitleSelection() {
    this.subtitleStreams.forEach((subtitle) => {
      const button = document.createElement('button');
      button.classList.add('explicit-resolution');

      const span = document.createElement('span');
      span.textContent = subtitle.text;
      button.appendChild(span);

      this.eventManager.listen(
        button,
        'click',
        () => this.onSubtitleClicked(subtitle.id),
      );

      if (subtitle.id === this.selectedSubtitleId) {
        button.setAttribute('aria-selected', 'true');
        button.appendChild(ShakaUtils.checkmarkIcon());
        span.classList.add('shaka-chosen-item');
        this.currentSelection.textContent = span.textContent;
      }

      this.menu.appendChild(button);
    });
  }

  onSubtitleClicked(subtitleId) {
    this.eventBus.$emit('subtitlestreamselectionchanged', subtitleId);
  }
};

class SubtitleSelectionFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  create(rootElement, controls) {
    return new SubtitleSelection(rootElement, controls, this.eventBus);
  }
};

export default SubtitleSelectionFactory;