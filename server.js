// ABOUT
// Runs the SyncLounge Server software - handles rooms
// Defaults to 8089

// V2.0

// USER CONFIG

// END USER CONFIG
const express = require('express');
const cors = require('cors');

const SettingsHelper = require('./SettingsHelper');

const settings = new SettingsHelper();

const root = express();
root.use(cors({ credentials: false }));
root.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', false);
  next();
});
const ptserver = express();

const PORT = process.env.server_port || 8089;

// Setup our PTServer

ptserver.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const connectedUsers = Object.keys(ptserver_io.sockets.connected).length;
  let load = 'low';
  if (connectedUsers > 25) {
    load = 'medium';
  }
  if (connectedUsers > 50) {
    load = 'high';
  }
  return res.send(JSON.stringify({ load })).end();
});
ptserver.get('/', (req, res) => res.send('You\'ve connected to the SLServer, you\'re probably looking for the webapp.'));
// Merge everything together

const serverRoot = settings.serverroot || '/slserver';
console.log('Setting up with serverRoot of', serverRoot);
root.use(serverRoot, ptserver);
root.get('*', (req, res) => res.send('You\'ve connected to the SLServer, you\'re probably looking for the webapp.'));

const rootserver = require('http').createServer(root);
const ptserver_io = require('socket.io')(rootserver, { path: `${serverRoot}/socket.io` });

ptserver_io.on('connection', (socket) => {
  console.log('Someone connected to the ptserver socket');

  socket.on('join', (data) => {
    // A user is attempting to join a room
    if (data == null) {
      return;
    }
    if (!data || !data.username || !data.room) {
      console.log('Invalid join attempt', data);
      return socket.emit('join-result', false, {}, 'Invalid data', []);
    }
    const tempUser = new User();
    let result = true;
    let _data = {};
    let details = `Successfully connected to ${data.room}`;

    if (socket.selfUser != null || socket.selfUser !== undefined) {
      // Already in a room! Leave the room we're in
      handleDisconnect(false);
    }
    let room = ptserver_io.sockets.adapter.rooms[data.room];
    if (room === undefined || room.users === undefined || room.users === null) {
      socket.join(data.room);
      room = ptserver_io.sockets.adapter.rooms[data.room];
      room.users = [];
      room.password = data.password;
      room.partyPausing = true;
      tempUser.role = 'host';
      tempUser.username = getValidUsername([], data.username);
    } else {
      tempUser.username = getValidUsername(room.users, data.username);
      if (room.password === null || room.password === '') {
        // Check if we've already got a Host
        if (room.hostUsername == null) {
          // We dont have a host user yet.
          // This should never happen..
          room.hostUsername = tempUser.username;
          tempUser.role = 'host';
          socket.join(data.room);
        } else {
          tempUser.role = 'guest';
          socket.join(data.room);
        }
      } else {
        // This room has a password
        if (room.password === data.password) {
          // Good password!
          if (room.hostUsername == null) {
            // We dont have a host user yet.
            room.hostUsername = tempUser.username;
            tempUser.role = 'host';
            socket.join(data.room);
          } else {
            tempUser.role = 'guest';
            socket.join(data.room);
          }
        } else {
          result = false;
          details = 'wrong password';
        }
      }
    }

    tempUser.avatarUrl = data.avatarUrl;

    // We've sorted out where the user should go, lets send back
    let currentUsers = null;
    if (result) {
      tempUser.room = data.room;
      console.log(`User ${tempUser.username} joined ${tempUser.room}`);
      if (tempUser.role === 'host') {
        room.hostUsername = tempUser.username;
      }
      room.users.push(tempUser);

      socket.broadcast.to(data.room).emit('user-joined', room.users, tempUser);
      // Set some objects on the socket for ease of use down the road
      socket.ourRoom = data.room;
      socket.selfUser = tempUser;
      currentUsers = room.users;
    } else {
      console.log('User failed to join a room');
    }
    _data = tempUser;
    socket.emit('join-result', result, _data, details, currentUsers, room.partyPausing);
  });
  socket.on('poll', (data) => {
    if (socket.ourRoom == null) {
      // console.log('This user should join a room first')
      socket.emit('flowerror', 'You aren\' connected to a room! Use join');
      socket.emit('rejoin');
      return;
    }
    const room = ptserver_io.sockets.adapter.rooms[socket.selfUser.room];
    if (!room) {
      console.log('Got a poll update from a user in a room that was either destroyed or never existed', data);
      return;
    }
    // Recieved an update from a user
    updateUserData(socket.selfUser.username, data, socket.selfUser.room);

    socket.emit('poll-result', ptserver_io.sockets.adapter.rooms[socket.selfUser.room].users, socket.selfUser, data.commandId, room.partyPausing);
    if (socket.selfUser.role === 'host') {
      // We're the host, broadcast to all clients our data
      const temp = {};
      temp.time = data.time;
      temp.maxTime = data.maxTime;
      temp.title = data.title;
      temp.rawTitle = data.rawTitle;
      temp.lastHeartbeat = new Date().getTime();
      temp.playerState = data.playerState;
      temp.clientResponseTime = data.clientResponseTime;
      temp.machineIdentifier = data.machineIdentifier;
      temp.type = data.type;
      temp.showName = data.showName;
      temp.key = data.key;
      temp.latency = data.latency;
      temp.showName = data.showName;
      temp.status = data.status;
      temp.playerProduct = data.playerProduct;
      socket.broadcast.to(socket.selfUser.room).emit('host-update', temp);
    }
  });
  socket.on('send_message', (msg) => {
    // console.log(msg)
    if (socket.ourRoom == null) {
      // console.log('This user should join a room first')
      socket.emit('flowerror', 'You aren\' connected to a room! Use join');
      socket.emit('rejoin');
      return;
    }
    // console.log('New message in channel ' + socket.selfUser.room + ' from ' + socket.selfUser.username + ' saying ' + msg)
    socket.broadcast.to(socket.selfUser.room).emit('new_message', {
      msg: msg.msg,
      user: {
        username: socket.selfUser.username,
        thumb: socket.selfUser.avatarUrl,
      },
      type: msg.type,
    });
  });
  socket.on('party_pausing_change', (value) => {
    const user = socket.selfUser;
    const room = ptserver_io.sockets.adapter.rooms[user.room];
    if (!user || !room) return 'Invalid status';
    if (user.role !== 'host') return 'You are not the host';
    room.partyPausing = value;
    socket.broadcast.to(socket.selfUser.room).emit('party-pausing-changed', { value, user });
    socket.emit('party-pausing-changed', { value, user });
    return true;
  });
  socket.on('party_pausing_send', () => {
    const user = socket.selfUser;
    const room = ptserver_io.sockets.adapter.rooms[user.room];
    if (!room || !room.partyPausing) {
      return false;
    }
    socket.broadcast.to(socket.selfUser.room).emit('party-pausing-pause', user);
    socket.emit('party-pausing-pause', user);
    return true;
  });
  socket.on('transfer_host', (data) => {
    if (socket.ourRoom == null) {
      socket.emit('flowerror', 'You aren\' connected to a room! Use join');
      socket.emit('rejoin');
      return;
    }
    transferHost(socket.selfUser, user => user.username === data.username);
  });
  socket.on('connect_timeout', () => {
    // console.log('timeout')
    handleDisconnect(true);
  });
  socket.on('disconnect', () => {
    handleDisconnect(true);
  });
  function handleDisconnect(disconnect) {
    if (socket.selfUser === undefined || socket.selfUser === null) {
      return;
    }
    // console.log('User left: ' + socket.selfUser.username)
    transferHost(socket.selfUser, user => user !== socket.selfUser);
    removeUser(socket.selfUser.room, socket.selfUser.username);
    if (ptserver_io.sockets.adapter.rooms[socket.selfUser.room]) {
      socket.broadcast.to(socket.selfUser.room).emit('user-left', ptserver_io.sockets.adapter.rooms[socket.selfUser.room].users, socket.selfUser);
    }
    socket.disconnect(disconnect);
  }
  function updateUserData(username, userData, room) {
    if (!room === undefined || room === undefined || room === null) {
      console.log('Tried to update a user who isnt in a room', username, userData, room);
      return false;
    }
    try {
      for (const i in ptserver_io.sockets.adapter.rooms[room].users) {
        const user = ptserver_io.sockets.adapter.rooms[room].users[i];
        if (user.username === username) {
          // This is our user
          user.time = userData.time;
          user.maxTime = userData.maxTime;
          user.title = userData.title;
          user.lastHeartbeat = (new Date()).getTime();
          user.playerState = userData.playerState;
          user.rawTitle = userData.rawTitle;
          user.clientResponseTime = userData.clientResponseTime;
          user.type = userData.type;
          user.showName = userData.showName || '';
          user.playerProduct = userData.playerProduct || '';
          user.status = userData.status || 'unknown';
          user.machineIdentifier = userData.machineIdentifier || '';
          user.key = userData.key;
          user.uuid = userData.uuid;
          return;
        }
      }
    } catch (e) {
      console.log('Failed to update a user', username, userData, room);
    }
  }
  function transferHost(user, newHostPredicate) {
    if (user.role !== 'host') {
      console.log('Not transfering host in room', user.room, 'from', user.username, 'because its role is', user.role);
      return;
    }
    const room = ptserver_io.sockets.adapter.rooms[user.room];
    if (!room) {
      console.log('Not transfering the host in the room', user.room, 'because the room was already destroyed');
      return;
    }
    const newHost = room.users.find(newHostPredicate);
    if (!newHost) {
      console.log('Not transfering host in room', user.room, 'from', user.username, 'because suitable user found');
      return;
    }
    console.log('Transfering host in room', user.room, 'from', user.username, 'to', newHost.username);
    user.role = 'guest';
    newHost.role = 'host';
    room.hostUser = newHost;
    room.hostUsername = newHost.username;
    socket.broadcast.to(user.room).emit('host-swap', newHost);
  }
  function removeUser(roomname, username) {
    const room = ptserver_io.sockets.adapter.rooms[roomname];
    if (room === undefined) {
      return;
    }
    for (const i in room.users) {
      if (room.users[i].username === username) {
        // This is the user that we need to remove
        room.users.splice(i, 1);
      }
    }
  }
  function getValidUsername(usersarray, wantedname) {
    let tempname = wantedname;
    while (true) {
      // We need to loop through the users list until we create a valid name
      let found = false;
      for (const i in usersarray) {
        if (usersarray[i].username === tempname) {
          // console.log(usersarray[i].username + ' == ' + tempname)
          found = true;
        }
      }
      if (found) {
        // Looks like that username is taken
        // Check if we've already appended '(x)'
        if (tempname.indexOf('(') > -1) {
          // we have
          const value = parseInt(tempname.substring(tempname.indexOf('(') + 1, tempname.indexOf(')')));
          const newvalue = value + 1;
          tempname = tempname.replace(`(${value})`, `(${newvalue})`);
        } else {
          // we haven't
          tempname += '(1)';
        }
      } else {
        // This is a valid name!
        return tempname;
      }
    }
  }

  var User = function () {
    this.username = null;
    this.role = null;
    this.room = null;
    this.title = null;
    this.time = null;
    this.avatarUrl = null;
  };
});
rootserver.listen(PORT);
console.log(`SyncLounge Server successfully started on port ${PORT}`);

setInterval(() => {
  console.log(`Connected users: ${Object.keys(ptserver_io.sockets.connected).length}`);
}, 5000);
