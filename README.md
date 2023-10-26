[github-release-badge]: https://img.shields.io/github/workflow/status/synclounge/synclounge/release?label=release&style=for-the-badge
[docker-version-badge]: https://img.shields.io/docker/v/synclounge/synclounge?label=Docker&sort=semver&style=for-the-badge
[docker-latest-size-badge]: https://img.shields.io/docker/image-size/synclounge/synclounge?sort=semver&style=for-the-badge
[docker-pulls-badge]: https://img.shields.io/docker/pulls/synclounge/synclounge?style=for-the-badge
[npm-badge]: https://img.shields.io/npm/v/synclounge?style=for-the-badge
[dependencies-badge]: https://img.shields.io/david/synclounge/synclounge?style=for-the-badge
[devdependencies-badge]: https://img.shields.io/david/dev/synclounge/synclounge?style=for-the-badge
[license-badge]: https://img.shields.io/github/license/synclounge/synclounge?style=for-the-badge
[app-badge]: https://img.shields.io/website?label=App&style=for-the-badge&up_message=online&url=https%3A%2F%2Fapp.synclounge.tv
[release-action-link]: https://github.com/synclounge/synclounge/actions?query=workflow%3Arelease+branch%3Amaster "Release action"
[dockerhub-link]: https://hub.docker.com/r/synclounge/synclounge "Docker images of SyncLounge"
[dockerhub-tags-link]: https://hub.docker.com/r/synclounge/synclounge/tags "Docker tags of Synclounge"
[docker-microbadger-link]: https://microbadger.com/images/synclounge/synclounge "Docker size"
[npm-link]: https://www.npmjs.com/package/synclounge "NPM package"
[dependencies-link]: https://david-dm.org/synclounge/synclounge
[devdependencies-link]: https://david-dm.org/synclounge/synclounge?type=dev
[app-link]: https://app.synclounge.tv
[license-link]: https://opensource.org/licenses/MIT "MIT License"

![SyncLounge](https://github.com/synclounge/synclounge/raw/master/src/assets/images/logos/logo-long-dark.png)

[![App][app-badge]][app-link]
[![npm][npm-badge]][npm-link]
[![Docker Version][docker-version-badge]][dockerhub-link]
[![Docker Size][docker-latest-size-badge]][dockerhub-link]
[![Docker Pulls][docker-pulls-badge]][dockerhub-link]
[![Release][github-release-badge]][release-action-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![License][license-badge]][license-link]

SyncLounge (Previously PlexTogether) is a tool to sync [Plex](https://plex.tv) content across multiple players in multiple locations.

## How it works

SyncLounge aims to keep multiple viewing sessions in sync regardless of whether the clients are in the same room or across the globe. To do this SyncLounge utilizes a middle-man server to communicate between each of the SyncLounge clients. Users choose their Plex client, decide on a SyncLounge Server and Room name and join up. Your friends/family can do the same. Whoever joins the room first will become the host.

The host has complete control over a room. Commands they send to their client will be sent through to other people in the room (Play, Pause, Seek etc). If the host starts playing something different, SyncLounge will search all of your available Plex Media Servers for an equivalent copy, even if it is not from the same Plex Media Server as the Host.

## Features

- Syncing between Plex Clients over the Internet
- SyncLounge Player
  - Plays content directly within SyncLounge.
  - Built specifically for syncing.
- Settings to tune SyncLounge to your environment
  - Client Polling Interval - Sets how frequently SyncLounge will poll the client for new information.
  - Sync Flexibility - Sets the acceptable distance away from the host in milliseconds.
  - Sync method:
  - Clean seek - Seeks straight to where the host is.
  - Skip ahead - Seeks 10 seconds ahead, pauses and then resumes 10 seconds later.
  - Plex Media Server blocking - allows you to restrict the servers SyncLounge searches for content.
- Autoplay content
  - SyncLounge will automatically search all of your available Plex Media Servers for content that is similar to the Host.
- Plex Media Server Browsing - find, search and fling content to Plex Clients from within SyncLounge.
- Metadata fetching from Plex Media Server
- Chat to others in your room
- Password locked rooms
- Invite others via generated short link
- Movies and TV Shows (Music not supported)

## Screenshots

Head to the [website](https://synclounge.tv)

## Supported Plex Clients

Theoretically, all Plex Clients that implement the Plex Client Protocol will work. As some clients have this implemented slightly differently, compatibility with SyncLounge may vary. If you have access to one of the untested clients please let us know so we can update our list below.

Some low powered clients may be hard to achieve a perfect sync with (for example: Raspberry Pi clients).

### Unsupported

- Plex Web Player (Chrome/Safari/Firefox)

### Supported

- Plex Media Player
- Plex Home Theater
- OpenPHT
- Rasplex
- Roku
- Android
- Nvidia Shield
- iOS (iPhone & iPad)
- AppleTV

### Broken

- Xbox One
- Xbox 360
- PS3
- PS4

## Documentation

### Installation

By default, it listens on port 8088. All the paths are relative, so you can use a reverse proxy at any subdirectory or subdomain without any additional configuration to SyncLounge. In this version, the webapp and socket server are combined so you only need to proxy that one port if you are using a reverse proxy.

#### Docker

Using the Docker image is the easiest path because it works out of the box.
You can get it running immediately by

```sh
docker pull synclounge/synclounge
docker run -p 8088:8088 synclounge/synclounge:latest
```

You can use environment variables to change any of the [default configuration](https://github.com/synclounge/synclounge/blob/master/config/defaults.js).  
Note that nested objects and arrays can be passed as environment variables in the following way:

```
AUTHENTICATION='{"mechanism":"plex","type":["server"],"authorized":["MACHINE_ID"]}'

SERVERS='[{"name":"My Server","location":"Mothership","url":"https://myserver.com","image":"https://myserver.com/myimage.jpg"}]'
```


#### Linux (Without Docker)

Make sure you have nodejs installed.

```sh
sudo npm install -g synclounge
```

Then you can run it:

```
synclounge
```

If you want to change any of the [default configuration](https://github.com/synclounge/synclounge/blob/master/config/defaults.js), you can either use environment variables with the same name, use command line arguments, or use a config file and run synclounge like `synclounge --config_file /path/to/config.json`

### Sample Nginx config

If you want to run SyncLounge behind Nginx, here is an example configuration

#### Subdomain sub.domain.com

```
map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      '';
}


server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    # TODO: Replace this with your domain
    server_name somesubdomain.yourserver.com;

    # TODO: include your ssl certs and parms, etc

    location / {
        # TODO: Replace this with your container address or localhost
        proxy_pass http://containeraddress:8088;
        proxy_http_version 1.1;
        proxy_socket_keepalive on;
        proxy_redirect off;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
    }
}
```

#### Subfolder domain.com/somefolder/

To make synclounge run at a subfolder, all you need to do is change your reverse proxy configuration.

```
map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      '';
}


server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    # TODO: Replace this with your domain
    server_name somesubdomain.yourserver.com;

    # TODO: include your ssl certs and parms, etc

    # TODO: replace "somefolder" with your desired subfolder
    location /somefolder/ {
        # TODO: Replace this with your container address or localhost.
        # Important: keep the trailing slash
        proxy_pass http://containeraddress:8088/;
        proxy_http_version 1.1;
        proxy_socket_keepalive on;
        proxy_redirect off;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
    }
}
``` 

The FAQ, Self-Hosting, Development, Contributing, and other documentation has been move to [docs.synclounge.tv](https://docs.synclounge.tv)! Head there for more information!

## Contributors

[samcm](https://twitter.com/durksau) - Developer

[gcordalis](https://twitter.com/gcordalis) - User Interface

[ttshivers](https://github.com/ttshivers) - Developer

[Brandz](https://twitter.com/homebrandz) - Design

[TheGrimmChester](https://github.com/TheGrimmChester) - Developer/Tester

[MagicalCodeMonkey](https://github.com/MagicalCodeMonkey) - Developer/Tester

[Starbix](https://github.com/Starbix) - Docker Support

kg6jay - Tester

## Contact

[Discord Server](https://discord.gg/Cp9RPSJ)

Twitter:
[SyncLounge](https://twitter.com/syncloungetv)

## License

SyncLounge is licensed under MIT License. See the `LICENSE.txt` file.
SyncLounge is in no way affiliated with Plex Inc.

Using [Material Design libraries](https://material.io/) provided under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode)
