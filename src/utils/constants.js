import { generateGuid } from './helpers';

export const defaultSettings = {
  CLIENTPOLLINTERVAL: 1000,
  AUTOPLAY: true,
  HIDEUSERNAME: false,
  DARKMODE: false,
  SYNCMODE: 'cleanseek',
  SYNCFLEXABILITY: 3000,
  CUSTOMSERVER: 'http://',
  SLPLAYERFORCETRANSCODE: false,
  CLIENTIDENTIFIER: `${generateGuid()}-${generateGuid()}`,
  blockedServers: [],
  LASTSERVER: '',
};

export default {
  defaultSettings,
};
