import bitrateselection from './bitrateselection';
import subtitleselection from './subtitleselection';
import audioselection from './audioselection';
import mediaselection from './mediaselection';
import subtitlecolorselection from './subtitlecolorselection';
import subtitlesizeselection from './subtitlesizeselection';
import subtitlepositionselection from './subtitlepositionselection';
import subtitleoffsetselection from './subtitleoffsetselection';

export default (store) => {
  bitrateselection(store);
  subtitleselection(store);
  audioselection(store);
  mediaselection(store);
  subtitlecolorselection(store);
  subtitlesizeselection(store);
  subtitlepositionselection(store);
  subtitleoffsetselection(store);
};
