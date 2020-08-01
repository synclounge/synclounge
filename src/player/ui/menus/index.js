import bitrateselection from './bitrateselection';
import subtitleselection from './subtitleselection';
import audioselection from './audioselection';
import mediaselection from './mediaselection';
import subtitlecolorselection from './subtitlecolorselection';

export default (store) => {
  bitrateselection(store);
  subtitleselection(store);
  audioselection(store);
  mediaselection(store);
  subtitlecolorselection(store);
};
