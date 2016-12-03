

var server = require('http').createServer();
var io = require('socket.io')(server);

io.on('connection', function(socket){
    console.log('new connection')
    socket.on('hello',function(){
        console.log('Client said hello')
        socket.emit('hello-result',true)
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

            socket.broadcast.to(data.room).emit('user-joined',tempUser)
            //Set some objects on the socket for ease of use down the road
            socket.ourRoom = data.room
            socket.selfUser = tempUser
            currentUsers = room.users
        } else {
            console.log('they joined NOT OK and were given the username ' + tempUser.username)
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
    socket.on('connect_timeout',function(){
        console.log('timeout')
        handleDisconnect(true)
    })
	socket.on('disconnect', function(){        
       handleDisconnect(true)
	});
    function handleDisconnect(disconnect){
        if (socket.selfUser === undefined || socket.selfUser === null){
            return
        }
        console.log('User left: ' + socket.selfUser.username)     
        if (socket.selfUser.role == 'host'){
            //Our Host has left, lets give the next Guest the Host role
            var newHost = transferHost(socket.selfUser.room)
            socket.broadcast.to(socket.selfUser.room).emit('host-swap',newHost)
        }
        removeUser(socket.selfUser.room,socket.selfUser.username)
        socket.broadcast.to(socket.selfUser.room).emit('user-left',socket.selfUser)
        socket.disconnect(disconnect)           
    }
});
server.listen(8088);
console.log('PlexTogether Server successfully started on port 8088')

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
function transferHost(room){
    var room = io.sockets.adapter.rooms[room]
    if (room === undefined){
        //Room has already been destroyed!
        return
    }
    var oldHost = removeHost() 
    if (oldHost === null || oldHost === undefined) {
        return
    }
    for (var i in room.users){
        if (room.users[i].username != oldHost.username){
            //This is a valid user
            console.log('Transferred host to ' + room.users[i].username)            
            room.users[i].role = 'host'
            room.hostUser = room.users[i]
            room.hostUsername = room.users[i].username
            return (room.users[i].username)        
        } 
    }
}
function removeHost(room){
    var room = io.sockets.adapter.rooms[room]
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
    var room = io.sockets.adapter.rooms[room]
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
                console.log(usersarray[i].username + ' == ' + tempname)
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



