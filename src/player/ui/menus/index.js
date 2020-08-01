import bitrateselection from './bitrateselection';
import subtitleselection from './subtitleselection';
import audioselection from './audioselection';
import mediaselection from './mediaselection';

export default (store) => {
  bitrateselection(store);
  subtitleselection(store);
  audioselection(store);
  mediaselection(store);
};
