const {ipcRenderer} = require('electron')
var remote = require('electron').remote



var ALT = 18;
// Setup our top bar
let macTop = '<ul id="dropdown1" class="dropdown-content" style="width: 150px; top: 60px; right: 6px;">\
                        <li class="hide"><a>Refresh</a></li>\
                        <li class="hide"><a class="preferences">Preferences</a></li>\
                        <li><a class="about">About</a></li>\
                        <li class="divider"></li>\
                        <li><a href="#!" onclick="logoutPlexTv()">Sign Out</a></li>\
                    </ul>\
                    <nav style="height: 64px; position: fixed; top: 0;">\
                        <div class="titlebar">\
                            <div class="titlebar-stoplight">\
                                <div class="titlebar-close mainClose">\
                                    <svg x="0px" y="0px" viewBox="0 0 6.4 6.4">\
                                        <polygon fill="#4d0000" points="6.4,0.8 5.6,0 3.2,2.4 0.8,0 0,0.8 2.4,3.2 0,5.6 0.8,6.4 3.2,4 5.6,6.4 6.4,5.6 4,3.2"></polygon>\
                                    </svg>\
                                </div>\
                                <div class="titlebar-minimize mainMinimise">\
                                    <svg x="0px" y="0px" viewBox="0 0 8 1.1">\
                                        <rect fill="#995700" width="6" height="1.1"></rect>\
                                    </svg>\
                                </div>\
                            </div>\
                        </div>\
                        <div class="nav-wrapper windowDrag">\
                            <a style="margin-left: 1220px; margin-top: -12px;" class="brand-logo">\
                                <div class="windowNoDrag dropdown-button" data-activates="dropdown1">\
                                    <img src="img/safetyAvatar.png" alt="" id="meAvatar" class="circle ptuser-avatar plexNavAccount">\
                                    <i class="material-icons navDropdown" style="float: right; color: #F2F3F4;  margin-top: -57px; margin-right: -2px; opacity: 0.5">arrow_drop_down</i>\
                                </div>\
                            </a>\
                        </div>\
                    </nav>'
let winTop = '<ul id="dropdown1" class="dropdown-content" style="width: 150px; top: 62px; left: -2px;">\
                        <li class="hide"><a>Refresh</a></li>\
                        <li class="hide"><a class="preferences">Preferences</a></li>\
                        <li><a class="about">About</a></li>\
                        <li class="divider"></li>\
                        <li><a href="#!" onclick="logoutPlexTv()">Sign Out</a></li>\
				</ul>\
				<nav style="height: 64px; position: fixed; top: 0;">\
					<div class="nav-wrapper windowDrag">\
						<a style="margin-left: 8px; margin-top: 8px;" class="brand-logo">\
							<div class="windowNoDrag dropdown-button" data-activates="dropdown1">\
								<img src="img/safetyAvatar.png" alt="" id="meAvatar" class="circle ptuser-avatar plexNavAccount">\
								<i class="material-icons navDropdown" style="float: right; color: #F2F3F4;  margin-top: 7px; margin-left: -10px;">arrow_drop_down</i>\
							</div>\
						</a>\
						<ul class="right windowNoDrag" style="position: fixed; top:0; right: 0; margin-right: 10px">\
							<li class="mainMinimise" style="padding-top:7px"><i class="material-icons menuButtons">remove</i></li>\
							<li class="mainClose"><i class="material-icons menuButtons">close</i></li>\
						</ul>\
					</div>\
				</nav>'
console.log(process.platform)
if (process.platform == 'win32') {
	document.getElementById('TopBar').innerHTML = winTop
} else {
    document.getElementById('TopBar').innerHTML = macTop
}
// Startup handling
var settingsEl = document.querySelector('.ptsettings')
settingsEl.addEventListener('click', function () {
	ipcRenderer.send('open-ptsettings-window')
})

var preferencesEl = document.querySelector('.preferences')
preferencesEl.addEventListener('click', function () {
	ipcRenderer.send('open-preferences-window')
})

var aboutEl = document.querySelector('.about')
aboutEl.addEventListener('click', function () {
	ipcRenderer.send('open-about-window')
})

var mainEl = document.querySelector('.mainClose')
mainEl.addEventListener('click', function () {
	ipcRenderer.send('close-main-window')
	console.log('Close Main')
})

mainEl = document.querySelector('.mainMinimise')
mainEl.addEventListener('click', function () {
	ipcRenderer.send('minimise-main-window')
})