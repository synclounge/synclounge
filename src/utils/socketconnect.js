import io from 'socket.io-client';

const socketConnect = (url, options) => new Promise(((resolve, reject) => {
  io.connect(url, options);

  io.once('connect', (socket) => {
    resolve(socket);
  });

  io.once('connect_error', () => {
    reject(new Error('connect_error'));
  });

  io.once('connect_timeout', () => {
    reject(new Error('connect_timeout'));
  });
}));

export default socketConnect;
