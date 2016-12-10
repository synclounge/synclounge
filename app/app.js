'use strict';
var request = require('request')
var fs = require('fs')
var AppDirectory = require('appdirectory')
const path = require('path');
const spawn = require('child_process').spawn;

global.log = require('electron-log');
global.log.transports.file.format = '[App] [{level}] {h}:{i}:{s}:{ms} {text}';

global.storage = require('electron-json-storage');

global.io = require('socket.io-client');
global.socket = null;
global.dirs = new AppDirectory('PlexTogether')
makeAppDataDir()

const electron = require('electron');
const app = require('electron').app;
const BrowserWindow = require('electron').BrowserWindow;
const {ipcMain} = require('electron');
var updater = require('electron').autoUpdater

var mainWindow = null;
var introWindow = null;
var settingsWindow = null;
var preferencesWindow = null;
var aboutWindow = null;

app.checkVersion = function(triggerManually) {
    manualCheck = triggerManually;
    updater.checkForUpdates();
};
ipcMain.on('install', function() {
    updateAvailable = false;
    updateReady = false;
    updater.quitAndInstall();
});


//Global Plex variable
var PlexTv = require('./js/plex/PlexTv.js')
global.plex = new PlexTv()


app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
	app.quit();
  }
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({
		frame: false,
		width: 1280,
		height: 720,
		minWidth: 1280,
		minHeight: 720,
		resizable: true,
		title: 'Plex Together',
		show: false,
		icon:'build/icon.ico'
	});
	introWindow = new BrowserWindow({
		frame: false,
		width: 1280,
		height: 720,
		resizable: false,
		title: 'Plex Together',
		show: false,
		icon:'build/icon.ico'
	});
	settingsWindow = new BrowserWindow({
		frame: false,
		height: 500,
		resizable: false,
		width: 752,
		alwaysOnTop: false,
		show:false,
		modal:true,
		transparent: true,
		parent:mainWindow
	});
	preferencesWindow = new BrowserWindow({
		frame: false,
		height: 450,
		resizable: false,
		width: 752,
		alwaysOnTop: false,
		show:false,
		modal:true,
		transparent: true,
		parent:mainWindow
	});
	aboutWindow = new BrowserWindow({
		frame: false,
		height: 450,
		resizable: false,
		width: 752,
		alwaysOnTop: false,
		show:false,
		modal:true,
		transparent: true,
		parent:mainWindow
	});



	introWindow.loadURL('file://' + __dirname + '/splash.html');
	//mainWindow.setMenu(null);
	introWindow.webContents.on('did-finish-load', () => {
		introWindow.show()
		sendSplashUpdate('Getting ready..')
		settingsWindow.loadURL('file://' + __dirname + '/ptsettings.html');
		preferencesWindow.loadURL('file://' + __dirname + '/preferences.html')
		aboutWindow.loadURL('file://' + __dirname + '/about.html')
	})
			
	/*
	Decide where to start our startup process

	Case 1: User has no settings json file
	-> Send to Plex Login Screen

	Case 2: User has a settings file
	-> Stay on splash screen, check token
	--> If token is valid, send to Home
	--> If token is not valid, send to Plex Login Screen 
	*/
	global.storage.get('plex-together-settings', function(error, data) {
		if (error) throw error;
		if (data.plextvtoken != null){
			//We have a token
			sendSplashUpdate('Logging in to Plex.tv..')
			plex.loginToken(data.plextvtoken,function(result){
				if (result){
					//Login successful! 
					//Lets fetch all the devices 
					sendSplashUpdate('Finding your Plex devices..')
					plex.getDevices(function(res){
						if (res){
							//We're all good!
							sendSplashUpdate('Let\'s go!')
							mainWindow.loadURL('file://' + __dirname + '/home.html')
						}
					})
				} else {
					//Token may have expired, send to login screen
					introWindow.loadURL('file://' + __dirname + '/signin.html')
				}
			})
		} else {
			sendSplashUpdate('Welcome!')
			introWindow.loadURL('file://' + __dirname + '/signin.html')
		}
	});
	ipcMain.on('pt-did-finish-load',function(){
		mainWindow.show()
		introWindow.hide()
	})
});

//Splash handling
function sendSplashUpdate(msg){
	introWindow.send('splash-update-status',msg)
}

//General Functions
function makeAppDataDir(){
	var mkdirp = require('mkdirp');	
	var os = process.platform
	if (os == "win32"){
		mkdirp(dirs.userCache() + '\\Users')
		return ("windows")
	}
	if (os == "linux"){
		mkdirp(dirs.userConfig() + '/Users')
		return ("linux")
	}
	if (os == "darwin"){
		mkdirp(dirs.userData() + '/Users')
		return ("mac")
	}
	return(callback(null))
}
function getAppDataDir(){
	var os = process.platform
	if (os == "win32"){
		return (dirs.userCache())
	}
	if (os == "linux"){
		return (dirs.userConfig())
	}
	if (os == "darwin"){
		return (dirs.userData())
	}
	return(callback(null))
}
//IPC events
//Main Window handling
ipcMain.on('close-main-window', function () {
    if (mainWindow) {
        mainWindow.close();
		app.quit();
        process.exit(0);
    }
});

ipcMain.on('minimise-main-window', function () {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('maximise-main-window', function () {
    if (mainWindow) {
        mainWindow.maximize();
    }
});

// PT Settings Window
ipcMain.on('open-ptsettings-window', function () {
	if (settingsWindow.isVisible()) {
		return;
	}
	settingsWindow.show()

	settingsWindow.on('closed', function () {		
		settingsWindow.hide()
	});
});

ipcMain.on('close-ptsettings-window', function () {
	settingsWindow.reload();
	settingsWindow.hide()
});

// Preferences Window
ipcMain.on('open-preferences-window', function () {
	if (preferencesWindow.isVisible()) {
		return;
	}
	preferencesWindow.show()
	

	preferencesWindow.on('closed', function () {
		preferencesWindow.hide()
	});
});

ipcMain.on('close-preferences-window', function () {
	preferencesWindow.hide();
});


// About Window
ipcMain.on('open-about-window', function () {
	if (aboutWindow.isVisible()) {
		return;
	}
	aboutWindow.show()

	aboutWindow.on('closed', function () {
		aboutWindow.hide()
	});
});
ipcMain.on('close-about-window', function () {
	aboutWindow.hide();
});

//Plextv signin events
ipcMain.on('plextv-signin', function(event,username,password){
	//Sign in button pressed on Sign In page
	plex.doStandardLogin(username,password,function(result){
		if (result == 201){
			global.storage.set('plex-together-settings',{'plextvtoken':plex.user.authToken}, function(error) {
				if (error) throw error;
			});
			plex.getDevices(function(devicesResult){
				event.sender.send('plextv-signin-result',devicesResult);
				if (devicesResult){
					//Looks like our login was successful
					//Lets wait 1 second and then swap over to Home
					setTimeout(function(){
						mainWindow.loadURL('file://' + __dirname + '/home.html')
					},1000)
				}
			})
		} else {
			event.sender.send('plextv-signin-result',result)
		}
	})	
});
ipcMain.on('plextv-signout',function(event){
	introWindow.loadURL('file://' + __dirname + '/signin.html')
	global.storage.set('plex-together-settings',{'plextvtoken':""}, function(error) {
		if (error) throw error;
	});
	mainWindow.minimize();
	introWindow.show();
})
//Home events
ipcMain.on('home-tab-initialize', function(event){
	plex.createHttpServer()
	for (var i in plex.servers){
		//We need to proc checking all of our servers!
		var server = plex.servers[i]
			server.findConnection(function(res){
				//log.info(plex.servers)
		})
	}
	event.sender.send('home-tab-initialize-result',plex.user.username
	,plex.clients,plex.servers);
});
ipcMain.on('home-tab-me-avatar',function(){
	var path = getAppDataDir() + '/' + plex.user.username
        var options = {
			url : plex.user.avatar,
			headers : {
			},
			timeout : 5000
		}
		request(options,function(error,response,body){
		}).pipe(fs.createWriteStream(path))
			.on('close', function() {
				event.sender.send('home-tab-me-avatar',true,path)
			});
})
//Client or server clicked
ipcMain.on('home-tab-clientclicked',function(event,clientId){
	plex.chosenClient = null	
	plex.getClientById(clientId,function(client){	
		if (client != null){
			//Time to test if this client actually can be connected to!
			var count = 0
			client.findConnection(function(res){
				count++
				if (res){
					//We found a viable connection for this client! 
					//We need to start some loops that will constantly check this client 
					// for what is happening.
					//log.info('This client is good to be used! ' + client.name)
					var clientInterval = setInterval(function(){													
						if (plex.chosenClient == null){
							//Looks like we no longer have a valid client, lets stop this loop
							clearInterval(clientInterval)
						}
					},1000)
					plex.chosenClient = client
				} else {
					plex.chosenClient = null
				}
				event.sender.send('home-tab-clientclicked-result',res,client)
				if (count == client.plexConnections.length){
					if (client.chosenConnection != null){ 
						
						if (plex.chosenClient.unsubscribed == undefined) {
							plex.chosenClient.unsubscribe(function(){})
							plex.chosenClient.unsubscribed = true
						}               
						plex.chosenClient.on('client-update',
							function(){
								//mainWindow.send('pt-sendPoll-manual')
							}
						)
						event.sender.send('fire-notification','Plex Client','Successfully connected to ' + client.name)
					} else {
						event.sender.send('fire-notification','Plex Client','Unable to connect to ' + client.name)
					}					
				}
			})
		} else {
			log.info('clientId to Server lookup failed on ' + clientId)
		}
	})
})
ipcMain.on('home-tab-serverclicked',function(event,clientId){
	plex.getServerById(clientId,function(server){
		if (server == plex.chosenServer){				
				plex.chosenServer = null
				event.sender.send('home-tab-serverclicked-result',false,"")
		} else {		
			plex.chosenServer = server		
			event.sender.send('home-tab-serverclicked-result',true,server)
		}
	})
})

//Metadata handling
ipcMain.on('home-metadata-download',function(event,server,metadata){
	plex.getServerById(server.clientIdentifier,function(res){
		if (res == null){
			return event.sender.send('home-metadata-download-result',false,'')
		}
		if (metadata == null) {
			return event.sender.send('home-metadata-download-result',false,'')
		}
		
		server = res
		var _url = server.chosenConnection.uri + metadata.thumb
		if (metadata.type == 'episode'){
			_url = server.chosenConnection.uri + metadata.grandparentThumb
		}

		var path = getAppDataDir() + '/plexThumb.jpg'
		log.info(path)
        var options = {
			url : _url,
			headers : {
			"X-Plex-Token" : server.accessToken
			},
			timeout : 5000
		}
		request(options,function(error,response,body){
		}).pipe(fs.createWriteStream(path))
			.on('close', function() {
				event.sender.send('home-metadata-download-result',true,path)
			});
		})
	
	
});
ipcMain.on('ptuser-thumb-download',function(event,userData){
	var path = getAppDataDir() + '/Users/' + userData.username + '.jpg'
	request(userData.avatarUrl,function(error,response,body){
		}).pipe(fs.createWriteStream(path))
			.on('close', function() {
				log.info('downloading done from ' + path)
				event.sender.send('ptuser-thumb-download-result',true,path,userData)
			});
})
ipcMain.on('ptmain-thumb-download',function(event){
	log.info('downloading')
	var path = getAppDataDir() + '/Users/' + plex.user.username + '.jpg'
	request(plex.user.thumb,function(error,response,body){
		}).pipe(fs.createWriteStream(path))
			.on('close', function() {
				log.info('downloading done from ' + path)
				event.sender.send('ptmain-thumb-download-result',true,path)
			});
})
ipcMain.on('connect-to-ptserver',function(event,address){
	global.socket = global.io.connect(address,{'sync disconnect on unload':true,'forceNew': true,
	'connect timeout': 2000 })
	global.socket.on('connect',function(){
		log.info('good connection')
		settingsWindow.send('connect-ptserver-success')
	})
	global.socket.on('connect_error',function(){
		global.socket.disconnect()
		log.info('bad connection')
		settingsWindow.send('connect-ptserver-fail')
	})	
})
ipcMain.on('ptsettings-fetch-serverlist', function(event) {
	request('http://103.43.75.57:8889/servers',function(error,response,body){
		if (!error){
			log.info(body)
			event.sender.send('ptsettings-fetch-serverlist-result',response,JSON.parse(body))
		}
	})
})
ipcMain.on('join-ptroom',function(event,userData){
	if (global.socket === null || global.socket === undefined || global.socket.connected == false){
        event.sender.send('join-ptroom-result',false,'Not connected to server')
		return
    }
	global.socket.emit('join',userData)
	global.socket.on('join-result',function(result,data,details,currentUsers){
		event.sender.send('join-ptroom-result',result,data,details,currentUsers)
		
	})

})



//Handlers for once were in a room
ipcMain.on('join-room-ok',function(event,data,details,currentUsers){
	mainWindow.send('pt-server-showInfo')
	global.ourUser = {}
	global.ourUser.username = data.username
	global.ourUser.role = data.role
	global.ourUser.room = data.room
	mainWindow.send('pt-updateSelfUsername',data.username)

	currentUsers.reverse()
	for (var i in currentUsers){
		if (currentUsers[i].username != global.ourUser.username){
			mainWindow.send('pt-addPTUser',currentUsers[i])
		}				
	}
	global.socket.on('poll-result',function(users){
		//Calculate the response time
		global.socket.pollRecievedTime = (new Date).getTime()
		global.socket.pollLastResponseTime =  Math.abs(global.socket.pollRecievedTime
		- global.socket.pollStartTime)
		for (var i in users){
			mainWindow.send('pt-updatePTUser',users[i])
		}
	})
	global.socket.on('user-joined',function(user){        
		mainWindow.send('pt-addPTUser',user)
	})
	global.socket.on('user-left',function(user){
		mainWindow.send('pt-removePTUser',user)
	})
	global.socket.on('host-update',function(hostdata){
		mainWindow.send('pt-handleHostUpdate',hostdata)
	})
	global.socket.on('host-swap',function(newHostUsername){
		if (newHostUsername == global.ourUser.username){
			//We're the host now
			global.ourUser.role = 'host'
		}
	})
	global.socket.on('error',function(msg){
		log.info(msg)		
	})
	global.socket.on('rejoin',function(){
		mainWindow.send('pt-clearTickers')
		socket.emit('join',global.ourUser)
	})
	global.socket.on('disconnect', function(){
		// We have disconnected from the PTServer. Remove all users and remove info
		handleSocketDisconnect();
	})
	settingsWindow.hide()
	mainWindow.send('start-handling-room-events',data,details,currentUsers)
})
ipcMain.on('pt-sendPoll',function(event,data){
	if (!global.socket){
		return
	}
	global.socket.pollStartTime = (new Date).getTime() 
	global.log.info('Sending our data to the PT server')
	global.socket.emit('poll',data)
})
ipcMain.on('pt-server-address-change',function(event,address){
	mainWindow.send('pt-server-address-change',address)
})
ipcMain.on('pt-server-room-change',function(event,room,password){
	mainWindow.send('pt-server-room-change',room,password)
})
ipcMain.on('pt-server-showInfo',function(event){
	mainWindow.send('pt-server-showInfo')
})
ipcMain.on('pt-server-hideInfo',function(event){
	mainWindow.send('pt-server-hideInfo')
})
//Forward notifications to the main window
ipcMain.on('fire-notification',function(event,title,message,time){
	mainWindow.send('fire-notification',title,message,time)
})
ipcMain.on('disconnect-socket', function(event){
	if (global.socket.connected){
		log.info('disconnecting!')
		global.socket.disconnect()
		global.socket = null;
		settingsWindow.loadURL('file://' + __dirname + '/ptsettings.html')
	}
	
})

function handleSocketDisconnect(){
	mainWindow.send('pt-server-disconnect')
	
}