import bitrateselection from './bitrateselection';
import subtitleselection from './subtitleselection';
import audioselection from './audioselection';
import mediaselection from './mediaselection';
import closebutton from './closebutton';
import nextbutton from './nextbutton';
import previousbutton from './previousbutton';
import './forward30button';
import './replay10button';

export default (store) => {
  bitrateselection(store);
  subtitleselection(store);
  audioselection(store);
  mediaselection(store);
  closebutton(store);
  nextbutton(store);
  previousbutton(store);
};
