[github-release-badge]: https://github.com/ttshivers/synclounge/workflows/release/badge.svg
[docker-version-badge]: https://images.microbadger.com/badges/version/ttshivers/synclounge:latest.svg
[docker-latest-size-badge]: https://images.microbadger.com/badges/image/ttshivers/synclounge:latest.svg
[docker-pulls-badge]: https://img.shields.io/docker/pulls/ttshivers/synclounge.svg
[license-badge]: https://img.shields.io/badge/License-MIT-yellow.svg

[release-action-link]: https://github.com/ttshivers/synclounge/actions?query=workflow%3Arelease+branch%3Amaster "Release action"
[dockerhub-link]: https://hub.docker.com/r/ttshivers/synclounge "Docker images of SyncLounge"
[docker-microbadger-link]: https://microbadger.com/images/ttshivers/synclounge:latest "Docker size"
[license-link]: https://opensource.org/licenses/MIT "MIT License"

![SyncLounge](https://app.synclounge.tv/logo-long-dark.png)

[![Release][github-release-badge]][release-action-link]
[![Version][docker-version-badge]][docker-microbadger-link]
[![Size][docker-latest-size-badge]][docker-microbadger-link]
[![Pulls][docker-pulls-badge]][dockerhub-link]
[![License][license-badge]][license-link]


This is a fork of [https://github.com/samcm/synclounge](https://github.com/samcm/synclounge) with improved stability and features like direct stream and direct play support. Some of the configuration is different than the main version, so that documentation may not always apply here.

I run an instance of this version at [https://synclounge.ttshivers.com](https://synclounge.ttshivers.com) which you are free to use.

# Features over main version
	- Simplified room creation and joining process
	- Better web player (same as what Plex web uses)
		- Direct play and direct stream support
		- Native subtitle support
		- Skip next / previous controls to easily navigate episodes in a show
		- Better high bitrate support with no more "appendBuffer" errors
	- Skip intro / auto skip intro
	- Auto Host (Anyone can start playing new content rather than just the host)
	- Sound / desktop notifications for chat
	- Major rewrite / cleanup of sync logic

---

SyncLounge (Previously PlexTogether) is a tool to sync [Plex](http://plex.tv) content across multiple players in multiple locations.

## How it works
SyncLounge aims to keep multiple viewing sessions in sync regardless of whether the clients are in the same room or across the globe. To do this SyncLounge utilizes a middle-man server to communicate between each of the SyncLounge clients. Users choose their Plex client, decide on a SyncLounge Server and Room name and join up. Your friends/family can do the same. Whoever joins the room first will become the host.

The host has complete control over a room. Commands they send to their client will be sent through to other people in the room (Play, Pause, Seek etc). If the host starts playing something different, SyncLounge will search all of your available Plex Media Servers for an equiavalent copy, even if it is not from the same Plex Media Server as the Host.

## Features
* Syncing between Plex Clients over the Internet
* SyncLounge Player
	* Plays content directly within SyncLounge.
	* Built specifically for syncing.
* Settings to tune SyncLounge to your environment
	* Client Polling Interval - Sets how frequently SyncLounge will poll the client for new information.
	* Sync Flexability - Sets the acceptable distance away from the host in milliseconds.
	* Sync method:
		* Clean seek - Seeks straight to where the host is.
		* Skip ahead - Seeks 10 seconds ahead, pauses and then resumes 10 seconds later.
	* Plex Media Server blocking - allows you to restrict the servers SyncLounge searches for content.
* Autoplay content
	* SyncLounge will automatically search all of your available Plex Media Servers for content that is similar to the Host.
* Plex Media Server Browsing - find, search and fling content to Plex Clients from within SyncLounge.
* Metadata fetching from Plex Media Server
* Chat to others in your room
* Password locked rooms
* Invite others via generated short link
* Movies and TV Shows (Music not supported)

## Screenshots

Head to the [website](http://synclounge.tv)

## Supported Plex Clients
Theoretically, all Plex Clients that implement the Plex Client Protocol will work. As some clients have this implemented slightly differently, compability with SyncLounge may vary. If you have access to one of the untested clients please let us know so we can update our list below.

Some low powered clients may be hard to achieve a perfect sync with (for example: Raspberry Pi clients).

### Unsupported
* Plex Web Player (Chrome/Safari/Firefox)

### Supported

* Plex Media Player
* Plex Home Theater
* OpenPHT
* Rasplex
* Roku
* Android
* Nvidia Shield
* iOS (iPhone & iPad)
* AppleTV

### Broken
* Xbox One
* Xbox 360
* PS3
* PS4

## Documentation

This fork has diverged some from the main SyncLounge repository, so not all the documentation for it is applicable here.

### Installation
By default, it listens on port 8088. All the paths are relative, so you can use a reverse proxy at any subdirectory or subdomain without any additional configuration to SyncLounge. In this version, the webapp and socket server are combined so you only need to proxy that one port if you are using a reverse proxy.


#### Docker
Using the Docker image is the easiest path because it works out of the box.
You can get it running immediately by
```sh
docker pull ttshivers/synclounge
docker run -p 8080:8088 ttshivers/synclounge:latest
```

You can use environment variables to change any of the [default configuration](https://github.com/ttshivers/synclounge/blob/master/config/defaults.js).

#### Linux (Without Docker)
Make sure you have git, nodejs, and npm installed. Then, clone and build the repository
```sh
git clone https://github.com/ttshivers/synclounge.git
cd synclounge
# Install dependencies
npm ci
npm run build
```

Once it's build, you can run it
```sh
./server.js
```

If you want to change any of the [default configuration](https://github.com/ttshivers/synclounge/blob/master/config/defaults.js), you can either use environment variables with the same name, use command line arguments, or edit `dist/config.json`. If you rebuild, `dist/config.json` will be overwritten, so be aware.


### Older Help
The FAQ, Self-Hosting, Development, Contributing, and other documentation has been move to [docs.synclounge.tv](http://docs.synclounge.tv)! Head there for more information!

## Contributors
[samcm](https://twitter.com/durksau) - Developer

[gcordalis](https://twitter.com/midnitegc) - User Interface

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

SyncLounge is licensed under MIT License. See the ``LICENSE.txt`` file.
SyncLounge is in no way affiliated with Plex Inc.

Using [Material Design libraries](https://material.io/) provided under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode)
