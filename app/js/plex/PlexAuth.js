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
