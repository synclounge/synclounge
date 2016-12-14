/**
 *
 * @param url
 * @param accessToken
 * @param timeout
 * @param method
 * @returns {{url: *, time: boolean, headers: {X-Plex-Client-Identifier: string, Accept: string, X-Plex-Token: *}, timeout: *, method: *}}
 */
this.getApiOptions = function getApiOptions(url, accessToken, timeout, method) {
  return {
    url: url,
    time: true,
    headers: {
      'X-Plex-Client-Identifier': global.constants.X_PLEX_CLIENT_IDENTIFIER,
      'Accept': 'application/json',
      'X-Plex-Token': accessToken
    },
    timeout: timeout,
    method: method
  }
};

/**
 *
 * @param url
 * @param clientIdentifier
 * @param uuid
 * @param timeout
 * @returns {{url: *, time: boolean, headers: {X-Plex-Device-Name: string, X-Plex-Client-Identifier: string, X-Plex-Provides: string, X-Plex-Target-Client-Identifier: *}, timeout: *, method: string}}
 */
this.getClientApiOptions = function getApiOptions(url, clientIdentifier, uuid, timeout) {
  return {
    url: url,
    time: true,
    headers: {
      'X-Plex-Device-Name': global.constants.X_PLEX_DEVICE_NAME,
      'X-Plex-Client-Identifier': (uuid != null) ? global.constants.X_PLEX_CLIENT_IDENTIFIER + '_' + uuid : global.constants.X_PLEX_CLIENT_IDENTIFIER,
      'X-Plex-Provides': 'controller',
      'X-Plex-Target-Client-Identifier': clientIdentifier
    },
    timeout: timeout,
    method: 'GET'
  }
};