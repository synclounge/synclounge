import { defaultSettings } from './constants';
import { get } from './storage';

const keys = [
  'AUTOPLAY',
  'CLIENTPOLLINTERVAL',
  'SYNCMODE',
  'SYNCFLEXABILITY',
  'CUSTOMSERVER',
  'BLOCKEDSERVERS',
  'HOMEINIT',
  'PTPLAYERQUALITY',
  'PTPLAYERVOLUME',
  'SLPLAYERFORCETRANSCODE',
  'HIDEUSERNAME',
  'ALTUSERNAME',
  'CLIENTIDENTIFIER',
  'LASTSERVER',
];

export const getAll = () => {
  const settings = {};
  keys.forEach((key) => {
    settings[key] = get(key);
    return true;
  });
  // Accept the default setting if the persisted value is null or undefined
  Object.keys(settings).forEach((key) => {
    if (settings[key] === undefined || settings[key] === null) {
      settings[key] = defaultSettings[key];
    }
  });
  return settings;
};

export default {
  getAll,
};
