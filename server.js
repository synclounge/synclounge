/* eslint-disable no-param-reassign */
// ABOUT
// Runs the SyncLounge Server software - handles rooms
// Defaults to 8089

// V2.0
const express = require('express');
const cors = require('cors');
const http = require('http');
const io = require('socket.io');

const { readSettings } = require('./SettingsHelper');

const settings = readSettings();

class User {
  constructor() {
    this.username = null;
    this.role = null;
    this.room = null;
    this.title = null;
    this.time = null;
    this.avatarUrl = null;
  }
}

const app = express();
const server = http.Server(app);
const router = express.Router();

// CI stuff
const port = process.env.WEBSOCKET_USE_PORT ? process.env.PORT : settings.server_port;

server.listen(port);

app.options('*', cors()); // enable pre-flight across-the-board
app.use(cors({ credentials: false }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', false);
  next();
});

app.use(settings.serverroot, router);
app.get('*', (req, res) => {
  res.send('You\'ve connected to the SLServer, you\'re probably looking for the webapp.');
});

const socketServer = io(server, {
  path: `${settings.serverroot}/socket.io`,
  handlePreflightRequest: (req, res) => {
    const headers = {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

// Setup our router
router.get('/', (req, res) => {
  res.send('You\'ve connected to the SLServer, you\'re probably looking for the webapp.');
});

router.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const connectedUsers = Object.keys(socketServer.sockets.connected).length;
  let load = 'low';
  if (connectedUsers > 25) {
    load = 'medium';
  }
  if (connectedUsers > 50) {
    load = 'high';
  }
  return res.send(JSON.stringify({ load })).end();
});

router.get('/users', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const users = Object.keys(socketServer.sockets.connected).length;
  return res.send(JSON.stringify({ users })).end();
});

socketServer.on('connection', (socket) => {
  function transferHost(user, newHostPredicate) {
    if (user.role !== 'host') {
      console.log('Not transfering host in room', user.room, 'from', user.username,
        'because its role is', user.role);
      return;
    }
    const room = socketServer.sockets.adapter.rooms[user.room];
    if (!room) {
      console.log('Not transfering the host in the room', user.room,
        'because the room was already destroyed');
      return;
    }
    const newHost = room.users.find(newHostPredicate);
    if (!newHost) {
      console.log('Not transfering host in room', user.room, 'from', user.username,
        'because suitable user found');
      return;
    }
    console.log('Transfering host in room', user.room, 'from', user.username, 'to',
      newHost.username);

    user.role = 'guest';
    newHost.role = 'host';
    room.hostUser = newHost;
    room.hostUsername = newHost.username;
    socket.broadcast.to(user.room).emit('host-swap', newHost);
  }

  function removeUser(roomname, username) {
    const room = socketServer.sockets.adapter.rooms[roomname];
    if (room === undefined) {
      return;
    }

    room.user = room.users.filter((user) => user.username !== username);
  }

  function handleDisconnect(disconnect) {
    if (socket.selfUser === undefined || socket.selfUser === null) {
      return;
    }
    // console.log('User left: ' + socket.selfUser.username)
    transferHost(socket.selfUser, (user) => user !== socket.selfUser);
    removeUser(socket.selfUser.room, socket.selfUser.username);
    if (socketServer.sockets.adapter.rooms[socket.selfUser.room]) {
      socket.broadcast.to(socket.selfUser.room).emit('user-left',
        socketServer.sockets.adapter.rooms[socket.selfUser.room].users, socket.selfUser);
    }
    socket.disconnect(disconnect);
    console.log(`Total Connected users: ${Object.keys(socketServer.sockets.connected).length}`);
  }

  function updateUserData(username, userData, room) {
    if (!room) {
      console.log('Tried to update a user who isnt in a room', username, userData, room);
      return false;
    }

    try {
      const foundUser = socketServer.sockets.adapter.rooms[room].users
        .find((user) => user.username === username);

      if (foundUser !== undefined) {
        // This is our user
        foundUser.time = userData.time;
        foundUser.maxTime = userData.maxTime;
        foundUser.title = userData.title;
        foundUser.lastHeartbeat = (new Date()).getTime();
        foundUser.playerState = userData.playerState;
        foundUser.rawTitle = userData.rawTitle;
        foundUser.clientResponseTime = userData.clientResponseTime;
        foundUser.type = userData.type;
        foundUser.parentTitle = userData.parentTitle || '';
        foundUser.grandparentTitle = userData.grandparentTitle || '';
        foundUser.playerProduct = userData.playerProduct || '';
        foundUser.status = userData.status || 'unknown';
        foundUser.machineIdentifier = userData.machineIdentifier || '';
        foundUser.key = userData.key;
        foundUser.uuid = userData.uuid;

        return true;
      }
    } catch (e) {
      console.log('Failed to update a user', username, userData, room);
    }

    return false;
  }

  function getNumberFromUsername(username) {
    return parseInt(username.match(/\((\d+)\)$/)[1], 10);
  }

  function getValidUsername(usersarray, wantedname) {
    const userSameName = usersarray.find((user) => user.username === wantedname);
    if (userSameName === undefined) {
      return wantedname;
    }

    // Get users with same username that are numbered like:  username(1)
    const sameUsersNum = usersarray.filter((user) => user.username.startsWith(`${wantedname}(`));
    if (sameUsersNum.length > 0) {
      const userNumbers = sameUsersNum.map((user) => getNumberFromUsername(user.username));
      const nextNumber = Math.max(...userNumbers) + 1;

      return `${wantedname}(${nextNumber})`;
    }

    return `${wantedname}(1)`;
  }

  console.log('Someone connected to the SyncLounge server socket');
  console.log(`Total Connected users: ${Object.keys(socketServer.sockets.connected).length}`);

  socket.on('join', (data) => {
    // A user is attempting to join a room
    if (data == null) {
      return;
    }

    if (!data || !data.username || !data.room) {
      console.log('Invalid join attempt', data);
      socket.emit('join-result', false, {}, 'Invalid data', []);
      return;
    }

    const tempUser = new User();
    let result = true;

    let details = `Successfully connected to ${data.room}`;

    if (socket.selfUser != null || socket.selfUser !== undefined) {
      // Already in a room! Leave the room we're in
      handleDisconnect(false);
    }

    let room = socketServer.sockets.adapter.rooms[data.room];
    if (room === undefined || room.users === undefined || room.users === null) {
      socket.join(data.room);
      room = socketServer.sockets.adapter.rooms[data.room];
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
      } else if (room.password === data.password) {
        // This room has a password
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

    socket.emit('join-result', result, tempUser, details, currentUsers, room.partyPausing);
  });

  socket.on('poll', (data) => {
    if (socket.ourRoom == null) {
      // console.log('This user should join a room first')
      socket.emit('flowerror', 'You aren\' connected to a room! Use join');
      socket.emit('rejoin');
      return;
    }

    const room = socketServer.sockets.adapter.rooms[socket.selfUser.room];
    if (!room) {
      console.log(
        'Got a poll update from a user in a room that was either destroyed or never existed',
        data,
      );
      return;
    }
    // Recieved an update from a user
    updateUserData(socket.selfUser.username, data, socket.selfUser.room);

    socket.emit('poll-result',
      socketServer.sockets.adapter.rooms[socket.selfUser.room].users,
      socket.selfUser,
      data.commandId,
      room.partyPausing);

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
      temp.key = data.key;
      temp.latency = data.latency;
      temp.parentTitle = data.parentTitle;

      temp.grandparentTitle = data.grandparentTitle;
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
    const room = socketServer.sockets.adapter.rooms[user.room];
    if (!user || !room) return 'Invalid status';
    if (user.role !== 'host') return 'You are not the host';
    room.partyPausing = value;
    socket.broadcast.to(socket.selfUser.room).emit('party-pausing-changed', { value, user });
    socket.emit('party-pausing-changed', { value, user });
    return true;
  });

  socket.on('party_pausing_send', (isPause) => {
    const user = socket.selfUser;
    const room = socketServer.sockets.adapter.rooms[user.room];
    if (!room || !room.partyPausing) {
      return false;
    }
    socket.broadcast.to(socket.selfUser.room).emit('party-pausing-pause', { isPause, user });
    socket.emit('party-pausing-pause', { isPause, user });
    return true;
  });

  socket.on('transfer_host', (data) => {
    if (socket.ourRoom == null) {
      socket.emit('flowerror', 'You aren\'t connected to a room! Use join');
      socket.emit('rejoin');
      return;
    }
    transferHost(socket.selfUser, (user) => user.username === data.username);
  });

  socket.on('connect_timeout', () => {
    // console.log('timeout')
    handleDisconnect(true);
  });

  socket.on('disconnect', () => {
    handleDisconnect(true);
  });
});

console.log(`SyncLounge Server successfully started on port ${port}`);
console.log(`Running with base URL: ${settings.serverroot}`);
