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

};
