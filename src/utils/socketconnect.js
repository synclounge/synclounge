import io from 'socket.io-client';

const socketConnect = (url, options) => new Promise(((resolve, reject) => {
  const socket = io.connect(url, options);

  socket.once('connect', () => {
    resolve(socket);
  });

  socket.once('connect_error', () => {
    reject(new Error('connect_error'));
  });

  socket.once('connect_timeout', () => {
    reject(new Error('connect_timeout'));
  });
}));

export default socketConnect;
