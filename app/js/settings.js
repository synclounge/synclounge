'use strict';

const {ipcRenderer} = require('electron');
var remote = require('electron').remote;
var path = require('path');
var io = require('socket.io-client');

var modifierCheckboxes = document.querySelectorAll('.global-shortcut');
var closeEl = document.querySelector('.close');

closeEl.addEventListener('click', function (e) {
    ipcRenderer.send('close-ptsettings-window');
});
// Fetch server list
ipcRenderer.send('ptsettings-fetch-serverlist')
ipcRenderer.on('ptsettings-fetch-serverlist-result',function(event,result,servers){
    let dropdown = document.getElementById('PlexTogetherServers')
    if (result) {
        // Successfully retrieved server list from plexTogether API
        for (let i = 0; i < servers.length; i++) {
            let srv = servers[i]
            var option = new Option(srv.text,srv.url)
            dropdown.options[dropdown.options.length] = option;
        }
    }
})

for (var i = 0; i < modifierCheckboxes.length; i++) {
    var shortcutKeys = configuration.readSettings('shortcutKeys');
    var modifierKey = modifierCheckboxes[i].attributes['data-modifier-key'].value;
    modifierCheckboxes[i].checked = shortcutKeys.indexOf(modifierKey) !== -1;

    modifierCheckboxes[i].addEventListener('click', function (e) {
        bindModifierCheckboxes(e);
    });
}

function bindModifierCheckboxes(e) {
    var shortcutKeys = configuration.readSettings('shortcutKeys');
    var modifierKey = e.target.attributes['data-modifier-key'].value;

    if (shortcutKeys.indexOf(modifierKey) !== -1) {
        var shortcutKeyIndex = shortcutKeys.indexOf(modifierKey);
        shortcutKeys.splice(shortcutKeyIndex, 1);
    }
    else {
        shortcutKeys.push(modifierKey);
    }

    configuration.saveSettings('shortcutKeys', shortcutKeys);
    ipcRenderer.send('set-global-shortcuts');
}

function ServerSelectedChanged(){
    var dropdown = document.getElementById('PlexTogetherServers')
    console.log(dropdown.options[dropdown.selectedIndex].value)
    if (dropdown.options[dropdown.selectedIndex].value == 'custom') {
        $('#customField').removeClass('hide')
    } else {
        connectToPTServer(dropdown.options[dropdown.selectedIndex].value)
    }
}
function customClicked(){
    connectToPTServer($('#ptServerCustom').val())
}
//SocketIO handling
function connectToPTServer(address){
    document.getElementById('ptServerPreloader').style.opacity = 1
    console.log('connecting to ' + address)
    ipcRenderer.send('connect-to-ptserver',address)
	//global.socket = io.connect('au1.plextogether.com',{'sync disconnect on unload':true
    // global.socket = io.connect('localhost',{'sync disconnect on unload':true})
	ipcRenderer.on('connect-ptserver-fail',function(event){
		console.log('FAILED TO CONNECT TO THE PTSERVER')
        $('#serverSuccess').addClass('hide')
        document.getElementById('ptServerPreloader').style.opacity = 0
    })	
    ipcRenderer.on('connect-ptserver-success',function(event){
		document.getElementById('ptServerPreloader').style.opacity = 0
        $('#serverSuccess').removeClass('hide')
        document.getElementById('ptRoom').focus()
        ipcRenderer.send('pt-server-address-change',address)
    })
}
function joinPTRoom(){
    console.log('attempting to join room')
    let wantedRoom = document.getElementById('ptRoom').value	
    if (wantedRoom === '' || wantedRoom === null){
        console.log('Choose the room you\'d like to join first!')
        return
    }
    let socket = remote.getGlobal('socket')
    if (socket === null || !socket.connected) {
        console.log('Connect to a server first!')
        return
    }
    ipcRenderer.send('join-ptroom',getHandshakeUser())
    ipcRenderer.on('join-ptroom-result',function(event,result,data,details,currentUsers){
        handleRoomJoinAttempt(result,data,details,currentUsers)
    })
}
function handleRoomJoinAttempt(result,data,details,currentUsers){
    console.log(currentUsers)
    if (result){          
        //Join successful			
        //Now we'll pass over control to roomEvents in homejs to handle everything
        ipcRenderer.send('pt-server-room-change',data.room,document.getElementById('ptRoomPassword').value)
        setTimeout(function(){
            ipcRenderer.send('join-room-ok',data,details,currentUsers,global.socket)
            ipcRenderer.send('pt-server-showInfo')
        },150)         
	} else {
        //Join FAILED
        if (details == 'wrong password'){
            console.log('wrong password')
        }
    }
}

function getHandshakeUser(){
    var plex = remote.getGlobal('plex') 
    var tempUser = {
        'username':plex.user.username,
        'room':document.getElementById('ptRoom').value,
        'password':document.getElementById('ptRoomPassword').value,
        'avatarUrl':plex.user.thumb
    }
    return tempUser
}