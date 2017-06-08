<p align="center"><img src ="https://plextogether.com/img/new/logo-long-dark.png" /></p>


 
<p align="center">
  <a href="https://hub.docker.com/r/starbix/plextogether/builds/"><img src="https://img.shields.io/docker/build/starbix/plextogether.svg" alt="Build Status"></a>
  <a href="https://microbadger.com/images/starbix/plextogether:latest"><img src="https://images.microbadger.com/badges/version/starbix/plextogether:latest.svg" alt="Version"></a>
  <a href="https://microbadger.com/images/starbix/plextogether:latest"><img src="https://images.microbadger.com/badges/image/starbix/plextogether:latest.svg" alt="Size"></a>
  <a href="https://hub.docker.com/r/starbix/plextogether/"><img src="https://img.shields.io/docker/pulls/starbix/plextogether.svg" alt="Pulls"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"></a>
  <br>
</p>
PlexTogether is a tool to sync [Plex](http://plex.tv) content across multiple players in multiple locations.

Utilising [Vue.js](https://vuejs.org/) and Webpack, PlexTogether has been rewritten and brought to the browser. While we run a live version available at [plextogether.com](http://app.plextogether.com), the project can be built and deployed completely seperate from plextogether.com. We also provide a handful of public PlexTogether Server instances that everyone is free to use.
<p align="center">
  <a href="http://app.plextogether.com">Live Version</a>
  <br>
</p>


## How it works
PlexTogether aims to keep multiple viewing sessions in sync regardless of whether the clients are in the same room or across the globe. To do this PlexTogether utilizes a middle-man server to communicate between each of PlexTogether clients. Users choose their Plex client, decide on a PlexTogether Server and Room name and join up. Your friends/family can do the same. Whoever joins the room first will become the host.

The host has complete control over a room. Commands they send to their client will be sent through to other people in the room (Play, Pause, Seek etc). If the host starts playing something different, PlexTogether will search all of your available Plex Media Servers for an equiavalent copy, even if it is not from the same Plex Media Server as the Host.

## Features
* Syncing between Plex Clients over the Internet
* (NEW) PlexTogether Player
	* Plays content directly within PlexTogether.
	* Built specifically for syncing. 
* Settings to tune PlexTogether to your environment
	* Client Polling Interval - Sets how frequently PlexTogether will poll the client for new information.
	* Sync Flexability - Sets the acceptable distance away from the host in milliseconds.
	* Sync method:
		* Clean seek - Seeks straight to where the host is.
		* Skip ahead - Seeks 10 seconds ahead, pauses and then resumes 10 seconds later.
	* Plex Media Server blocking - allows you to restrict the servers PlexTogether searches for content. 
* Autoplay content
	* PlexTogether will automatically search all of your available Plex Media Servers for content that is similar to the Host.
* (NEW) Plex Media Server Browsing - find, search and fling content to Plex Clients from within PlexTogether. 
* Metadata fetching from Plex Media Server
* Chat to others in your room
* Password locked rooms
* Invite others via generated short link
* Movies and TV Shows (Music not supported)
## FAQ
* _I have to login to Plex.tv on the site, how come?_
	* PlexTogether uses your Plex account to fetch details about your Plex Clients and Media Servers to use within the app. 
* _Won't you have access to my username, password and Plex account?_
	* All of your details are stored client side (in your browser). Absolutely none of your **confidential** data is sent to our server. You can verify this by inspecting the Network tab within Chrome developer tools or if you would like you can deploy PlexTogether yourself - read the 'Building and deploying' section below.
* _What is sent then?_
	* When you've connected to a PlexTogether room, a few details are sent back and forth to the PlexTogether Server to enable syncing. The data sent contains the following:
		* Plex Username
		* Plex User Thumbnail URL
		* Content playing title (Eg. Lord of the Rings: The Fellowship of the Ring)
		* Current timestamp (Eg. 00:35:02)
		* Maximum timestamp (Eg. 03:48:18)
		* Playerstate (Eg. paused, stopped, playing)
		* Client response time (Ping time between you and your Plex Client)
	* NEW v1.01 - PT Server address, PT Server Room and PT Server Room Password are sent to the WebApp when you join a room to create shortened invite links.
* _What about the public server provided by PlexTogether? Is my data safe?_
	* We log absolutely nothing to disk. Data is kept within the room instance until you leave or the server restarts. We have enabled SSL on our public servers but if privacy is a concern for you we strongly suggest running your own server. For more details read the 'Building and Deploying' section below.

* _Speaking of SSL, why isn't the site served over HTTPS?_
 	* While we would love to run the PlexTogether application over HTTPS, doing so forces modern browsers in to blocking all HTTP connections. This effectively stops all communication with Plex Clients which are all HTTP.
## Screenshots

Head to the [website](http://plextogether.com/screenshots)

## Supported Plex Clients
Theoretically, all Plex Clients that implement the Plex Client Protocol will work. As some clients have this implemented slightly differently, compability with PlexTogether may vary. If you have access to one of the untested clients please let us know so we can update our list below.

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

### Broken
* iOS (iPhone & iPad)
* AppleTV
* Xbox One
* Xbox 360
* PS3
* PS4

## Contributing
Please use the Issue tracker here on Github for Issues & Feature requests. We'll gladly merge Pull requests if you're keen to get hands on with the development.


## Building and deploying

### Docker
This is the official Docker container for PlexTogether: https://hub.docker.com/r/starbix/plextogether

The following tags are available:
* latest / alpine: webapp and server based on alpine
* debian: webapp and server based on debian
* server: only server based on alpine
* dev: development version of webapp and server based on alpine
* nginx: latest + nginx reverse proxy
```
docker create \
  --name=plextogether \
	-p 8088:8088 \
	-p 8089:8089 \
  starbix/plextogether
```
Use this for the nginx tag:
```
docker create \
  --name=plextogether \
	-p 80:80 \
	-e DOMAIN=example.com \
  starbix/plextogether:nginx
```
### Building and running the webapp:

* Make sure you have Node v6+ installed

	*  ``git clone https://github.com/samcm/plextogether``
	*  ``cd plextogether``
	*  ``npm install``
	*  ``npm run build``
	*  ``node webapp.js --url=http://example.com/ptweb``
* The PT web app will be running at http://ip:8088/ptweb.


### Running the server:

* Make sure you have Node v6+ installed

	*  ``git clone https://github.com/samcm/plextogether``
	*  ``cd plextogether``
	*  ``npm install``
	*  ``npm run server``
* The PT server will be running at http://ip:8089/ptserver.

### Deploying:
* To run both the PlexTogether webapp and the PlexTogether server through a web server like nginx you will need to make sure you proxy websockets. Example nginx.conf:
	```
    server {
        listen 80;
    	server_name example.com;
    	root /location/of/plextogether/;
    	location /ptweb {
    		proxy_pass http://localhost:8088/ptweb;
		    proxy_http_version 1.1;
		    proxy_set_header Upgrade $http_upgrade;
		    proxy_set_header Connection "upgrade";
    	}
    	location /ptserver {
    		proxy_pass http://localhost:8089/ptserver;
		    proxy_http_version 1.1;
		    proxy_set_header Upgrade $http_upgrade;
		    proxy_set_header Connection "upgrade";
    	}
    	location / {
		    proxy_http_version 1.1;
		    proxy_set_header Upgrade $http_upgrade;
		    proxy_set_header Connection "upgrade";
    		proxy_pass http://localhost:8088/ptweb;
    	}
    }
    ```
## Developing

You need:

* Node v6+

	*  ``git clone https://github.com/samcm/plextogether``
	*  ``cd plextogether``
	*  ``npm install``
	*  ``npm run dev``
* Once Webpack has finished compiling, navigate to http://localhost:8080 in your web browser.
	* Hot reload is enabled
	* Suggested to install [Vue.js Devtools](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd?hl=en)


## Issues
If you run in to any issues:
* Raise an Issue here on Github. Try to be as detailed as possible by including details such as:
	* Operating System
		* Web Browser name and version
	* Plex Media Server details
		* Version
		* Operating System
		* Location (Local/Remote)
	* Plex Client details
		* Name
		* Version
		* Network connection (Wired/Wifi)
		* Platform

* Join the [Discord Server](https://discord.gg/Cp9RPSJ) and raise your issue.


## Contributors
[samcm](https://twitter.com/durksau) - Developer

[gcordalis](https://twitter.com/midnitegc) - User Interface

[Brandz](https://twitter.com/homebrandz) - Design

[TheGrimmChester](https://github.com/TheGrimmChester) - Developer/Tester

[Starbix](https://github.com/Starbix) - Docker Support

kg6jay - Tester

## Contact
[Discord Server](https://discord.gg/Cp9RPSJ)

Twitter:
[PlexTogether](https://twitter.com/plextogether)

## License

PlexTogether is licensed under MIT License. See the ``LICENSE.txt`` file.
PlexTogether is in no way affiliated with Plex Inc.
