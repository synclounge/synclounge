<p align="center"><img src="https://synclounge.tv/assets/img/SL_LOGO_800x200_DARK.png" /></p>

<p align="center">
  <a href="https://hub.docker.com/r/starbix/synclounge/builds/"><img src="https://img.shields.io/docker/build/starbix/synclounge.svg" alt="Build Status"></a>
  <a href="https://microbadger.com/images/starbix/synclounge:latest"><img src="https://images.microbadger.com/badges/version/starbix/synclounge:latest.svg" alt="Version"></a>
  <a href="https://microbadger.com/images/starbix/synclounge:latest"><img src="https://images.microbadger.com/badges/image/starbix/synclounge:latest.svg" alt="Size"></a>
  <a href="https://hub.docker.com/r/starbix/synclounge/"><img src="https://img.shields.io/docker/pulls/starbix/synclounge.svg" alt="Pulls"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"></a>
  <br>
</p>

SyncLounge (Previously PlexTogether) is a tool to sync [Plex](http://plex.tv) content across multiple players in multiple locations.

While we run a live version available at [synclounge.tv](http://app.synclounge.tv), the project can be built and deployed completely seperate from synclounge.tv. We also provide a handful of public SyncLounge Server instances that everyone is free to use.
<p align="center">
  <a href="http://app.synclounge.tv">Live Version</a>
  <br>
</p>

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
