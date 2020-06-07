/**
 *
 * @param url
 * @param accessToken
 * @param timeout
 * @param method
 * @returns {{url: *, time: boolean, headers: {X-Plex-Client-Identifier: string, Accept: string, X-Plex-Token: *}, timeout: *, method: *}}
 */
export default {
  getApiOptions(url, accessToken, timeout, method) {
    return {
      url,
      time: true,
      headers: {
        'X-Plex-Client-Identifier': 'SyncLounge',
        Accept: 'application/json',
        'X-Plex-Token': accessToken,
      },
      timeout,
      method,
    };
  },

  getRequestConfig(accessToken, timeout) {
    return {
      headers: {
        'X-Plex-Client-Identifier': 'SyncLounge',
        Accept: 'application/json',
        'X-Plex-Token': accessToken,
      },
      timeout,
    };
  },

  /**
   *
   * @param url
   * @param clientIdentifier
   * @param uuid
   * @param timeout
   * @returns {{url: *, time: boolean, headers: {X-Plex-Device-Name: string, X-Plex-Client-Identifier: string, X-Plex-Provides: string, X-Plex-Target-Client-Identifier: *}, timeout: *, method: string}}
   */
  getClientApiOptions(clientIdentifier, timeout, token) {
    let sBrowser;
    const sUsrAg = navigator.userAgent;
    if (sUsrAg.indexOf('Chrome') > -1) {
      sBrowser = 'Chrome';
    } else if (sUsrAg.indexOf('Safari') > -1) {
      sBrowser = 'Safari';
    } else if (sUsrAg.indexOf('Opera') > -1) {
      sBrowser = 'Opera';
    } else if (sUsrAg.indexOf('Firefox') > -1) {
      sBrowser = 'Firefox';
    } else if (sUsrAg.indexOf('MSIE') > -1) {
      sBrowser = 'Microsoft Internet Explorer';
    }
    return {
      headers: {
        'X-Plex-Device-Name': sBrowser,
        'x-plex-client-identifier': 'SyncLounge',
        'X-Plex-Provides': 'controller',
        'X-Plex-Target-Client-Identifier': clientIdentifier,
        'X-Plex-Device': `Web (${sBrowser})`,
        'X-Plex-Platform': 'SyncLounge',
        'X-Plex-Version': '4.18',
        'X-Plex-Client-Platform': 'Web',
        'X-Plex-Client-Product': 'SyncLounge for Web',
        'X-Plex-Product': 'SyncLounge',
        'X-Plex-Device-Vendor': sBrowser,
        'X-Plex-Platform-Version': '11.0',
        Accept: 'application/json',
        'X-Plex-Http-Pipeline': 'infinite',
        'X-Plex-Token': token,
      },
      timeout,
    };
  },
};
