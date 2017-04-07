/**
 *
 * @param url
 * @param accessToken
 * @param timeout
 * @param method
 * @returns {{url: *, time: boolean, headers: {X-Plex-Client-Identifier: string, Accept: string, X-Plex-Token: *}, timeout: *, method: *}}
 */
module.exports = function PlexAuth(){
    this.getApiOptions = function (url, accessToken, timeout, method) {
        return {
            url: url,
            time: true,
            headers: {
                'X-Plex-Client-Identifier': 'PlexTogetherWeb',
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
    this.getClientApiOptions = function (url, clientIdentifier, uuid, timeout) {
        return {
            url: url,
            time: true,
            headers: {
                'X-Plex-Device-Name': 'PlexTogetherWeb',
                'X-Plex-Client-Identifier': 'PlexTogetherWeb',
                'X-Plex-Provides': 'controller',
                'X-Plex-Target-Client-Identifier': clientIdentifier
            },
            timeout: timeout,
            method: 'GET'
        }
    };
}