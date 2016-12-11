/*
 * Global constants
 */
function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("X_PLEX_CLIENT_IDENTIFIER", 'PlexTogether');
define("CLIENT_INTERVAL_REFRESH", 1000);
