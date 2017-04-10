

var PORT = 8089

var express = require('express');
var path = require('path');

var all = express()
var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});
app.use('/',express.static(path.join(__dirname, 'dist')));



all.use('/ptweb',app)
all.use('/join/:id',function(req,res){
    let shortObj = shortenedLinks[req.params.id]
    if (!shortObj){
        return res.send('Whoops, looks like youve made a wrong turn..')        
    }
    return res.redirect(shortObj.fullUrl)
})
all.use('/',function(req,res){
    res.redirect('/ptweb');
})
var rootServer = require('http').createServer(all);
var io = require('socket.io')(rootServer);

var shortenedLinks = {}

function getUniqueId(){    
    while (true){
        let testId = (0|Math.random()*9e6).toString(36)
        if (!shortenedLinks[testId]){    // Check if we already have a shortURL using that id
            return testId
        }
    }

}

function shortenObj(data){
    let returnable = {}
    returnable.urlOrigin = data.urlOrigin
    returnable.owner = data.owner

    returnable.ptserver = data.ptserver
    returnable.ptroom = data.ptroomm
    returnable.ptpassword = data.ptpassword

    returnable.starttime = (new Date).getTime()
    returnable.id = getUniqueId()
    returnable.shortUrl = data.urlOrigin + '/join/' + returnable.id

    let params = {
        ptserver: data.ptserver,
        ptroom: data.ptroom,
        ptpassword: data.ptpassword,
        owner: data.owner
    }
    let query = ''
    for (let key in params) {
        query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
    }
    returnable.fullUrl = data.urlOrigin + '/ptweb#/join?' + query

    shortenedLinks[returnable.id] = returnable
    console.log(returnable)
    return returnable.shortUrl
}






io.on('connection', function(socket){
    console.log('new connection')
    socket.on('shorten',function(data){
        console.log('Creating a shortened link')

        socket.emit('shorten-result',shortenObj(data))
    })
    socket.on('join',function(data){
        //A user is attempting to join a room    
        if (data == null){
            return
        }    
        var tempUser = new user()
        var result = true
        var _data = {}
        var details = "Successfully connected to " + data.room 

        if (socket.selfUser != null || socket.selfUser != undefined){
            //Already in a room! Leave the room we're in
            handleDisconnect(false)
        }
        var room = io.sockets.adapter.rooms[data.room]
        let isFresh = false
        if (room === undefined || room.users === undefined || room.users === null){
            isFresh = true  
            socket.join(data.room)
            room = io.sockets.adapter.rooms[data.room]
            room.users = []                  
            room.password = data.password   
            tempUser.role = 'host'
            tempUser.username = getValidUsername([],data.username)
        } else {
            tempUser.username = getValidUsername(room.users,data.username)
            if (room.password == null || room.password == ''){            
                //Check if we've already got a Host
                if (room.hostUsername == null){
                    // We dont have a host user yet.
                    // This should never happen..
                    room.hostUsername = tempUser.username
                    tempUser.role = 'host'
                    socket.join(data.room)               
                } else {
                    tempUser.role = 'guest'
                    socket.join(data.room)
                }  
            } else {
                //This room has a password
                if (room.password == data.password){
                    //Good password!                 
                    if (room.hostUsername == null){
                        //We dont have a host user yet.
                        console.log('We dont have a host user')
                        room.hostUsername = tempUser.username     
                        tempUser.role = 'host'
                        socket.join(data.room)          
                    } else {
                        tempUser.role = 'guest'
                        socket.join(data.room)
                    }
                } else {
                    result = false
                    details = 'wrong password'
                }
            }
        }

        
        tempUser.avatarUrl = data.avatarUrl
        
        //We've sorted out where the user should go, lets send back
        var currentUsers = null
        if (result){
            tempUser.room = data.room
            console.log('User ' + tempUser.username  + ' joined ' + tempUser.room)
            if (tempUser.role == 'host'){
                room.hostUsername = tempUser.username
            }
            room.users.push(tempUser)
            console.log('they joined OK and were given the username ' + tempUser.username)

            socket.broadcast.to(data.room).emit('user-joined',room.users,tempUser)
            //Set some objects on the socket for ease of use down the road
            socket.ourRoom = data.room
            socket.selfUser = tempUser
            currentUsers = room.users
        } else {
            console.log('User failed to join a room')
        }     
        _data = tempUser
        socket.emit('join-result',result,_data,details,currentUsers)
    })
	socket.on('poll', function(data){
        if (socket.ourRoom == null){
            console.log('This user should join a room first')
            socket.emit('flowerror','You aren\' connected to a room! Use join')
            socket.emit('rejoin')
            return
        }
        //Recieved an update from a user
        updateUserData(socket.selfUser.username,data,socket.selfUser.room)
        //var users = io.sockets.adapter.rooms['hotline123'].users
        //console.log(JSON.stringify(io.sockets.adapter.rooms, null, 2))
        /*var clients_in_the_room = io.sockets.adapter.rooms[roomId]; 
        for (var clientId in clients_in_the_room ) {
            //console.log('client: %s', clientId); //Seeing is believing 
            var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
        }
        */


        socket.emit('poll-result',io.sockets.adapter.rooms[socket.selfUser.room].users)
        var room = io.sockets.adapter.rooms[socket.selfUser.room]
        if (socket.selfUser.role == 'host'){
            //We're the host, broadcast to all clients our data
            var temp = {}
            temp.time = data.time
            temp.maxTime = data.maxTime
            temp.title = data.title
            temp.rawTitle = data.rawTitle
            temp.lastHeartbeat = (new Date).getTime()
            temp.playerState = data.playerState
            temp.clientResponseTime = data.clientResponseTime
            temp.type = data.type
            temp.showName = data.showName
            socket.broadcast.to(socket.selfUser.room).emit('host-update',temp)
        }
    });
    socket.on('send_message',function(msg){
        //console.log(msg)
        if (socket.ourRoom == null){
            //console.log('This user should join a room first')
            socket.emit('flowerror','You aren\' connected to a room! Use join')
            socket.emit('rejoin')
            return
        }
        //console.log('New message in channel ' + socket.selfUser.room + ' from ' + socket.selfUser.username + ' saying ' + msg)
        socket.broadcast.to(socket.selfUser.room).emit('new_message',{
            msg: msg.msg,
            user: {
                username: socket.selfUser.username,
                thumb: socket.selfUser.avatarUrl
            },
            type: msg.type
        })
    })
    socket.on('connect_timeout',function(){
        //console.log('timeout')
        handleDisconnect(true)
    })
	socket.on('disconnect', function(){        
       handleDisconnect(true)
	});
    function handleDisconnect(disconnect){
        if (socket.selfUser === undefined || socket.selfUser === null){
            return
        }
        //console.log('User left: ' + socket.selfUser.username)     
        if (socket.selfUser.role == 'host'){
            //Our Host has left, lets give the next Guest the Host role
            var newHost = transferHost(socket.selfUser.room)
            //console.log('The new host is ' + newHost)
            //console.log(JSON.stringify(newHost,null,4))
            socket.broadcast.to(socket.selfUser.room).emit('host-swap',newHost)
        }
        removeUser(socket.selfUser.room,socket.selfUser.username)
        if (io.sockets.adapter.rooms[socket.selfUser.room]){
            socket.broadcast.to(socket.selfUser.room).emit('user-left',io.sockets.adapter.rooms[socket.selfUser.room].users,socket.selfUser)
        }        
        socket.disconnect(disconnect)           
    }
    function updateUserData(username,userData,room){
        for (var i in io.sockets.adapter.rooms[room].users){
            var user = io.sockets.adapter.rooms[room].users[i]
            if (user.username == username){
                //This is our user
                user.time = userData.time
                user.maxTime = userData.maxTime
                user.title = userData.title
                user.lastHeartbeat = (new Date).getTime()
                user.playerState = userData.playerState
                user.rawTitle = userData.rawTitle
                user.clientResponseTime = userData.clientResponseTime
                user.type = userData.type
                user.showName = userData.showName
                return
            }
        }
    }
    function transferHost(roomName){
        console.log('Transfering the host in the room ' + roomName)
        var room = io.sockets.adapter.rooms[roomName]
        if (room === undefined){
            //Room has already been destroyed!
            return
        }
        var oldHost = removeHost(room) 
        if (oldHost === null || oldHost === undefined) {
            return
        }
        for (var i in room.users){
            if (room.users[i].username != oldHost.username){
                //This is a valid user
                //console.log('Transferred host to ' + room.users[i].username)            
                room.users[i].role = 'host'
                room.hostUser = room.users[i]
                room.hostUsername = room.users[i].username
                return (room.users[i])        
            } 
        }
    }
    function removeHost(room){
        if (room === undefined){
            //Room has already been destroyed!
            return
        }
        for (var i in room.users){
            if (room.users[i].role == 'host'){
                room.users[i].role = 'guest'
                return(room.users[i])                       
            } 
        }
    }
    function removeUser(roomname,username){
        var room = io.sockets.adapter.rooms[roomname]
        if (room === undefined){
            return
        }
        for (var i in room.users){
            if (room.users[i].username == username){
                //This is the user that we need to remove
                room.users.splice(i,1)
            }
        }
    }
    function getValidUsername(usersarray,wantedname){
        var tempname = wantedname
        while (true){
            //We need to loop through the users list until we create a valid name
            var found = false;
            for (var i in usersarray){
                if (usersarray[i].username == tempname){
                    //console.log(usersarray[i].username + ' == ' + tempname)
                    found = true;
                }
            }
            if (found){
                //Looks like that username is taken
                //Check if we've already appended '(x)'
                if (tempname.indexOf('(') > -1){
                    //we have
                    var value = parseInt(tempname.substring(
                        tempname.indexOf('(')+1,tempname.indexOf(')')))
                    var newvalue = value + 1
                    tempname = tempname.replace('('+value+')','('+newvalue+')')
                } else {
                    //we haven't
                    tempname = tempname + '(1)'
                }
            } else {
                //This is a valid name!
                return tempname
            }
        }
    }

    var user = function(){
        this.username = null;
        this.role = null;
        this.room = null;
        this.title = null;
        this.time = null;
        this.avatarUrl = null;
    }
});
rootServer.listen(PORT);
console.log('PlexTogether Server successfully started on port ' + PORT)




setInterval(function(){
   console.log('Connected users: ' + Object.keys(io.sockets.connected).length)
},5000)






