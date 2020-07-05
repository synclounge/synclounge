import io from 'socket.io-client';

let socket = null;

export const open = (url, options) => new Promise(((resolve, reject) => {
  socket = io(url, options);

  socket.once('connect', () => {
    resolve(socket);
  });

  // TODO: do I need all these events?
  socket.once('connect_error', () => {
    reject(new Error('connect_error'));
  });

  socket.once('connect_timeout', () => {
    reject(new Error('connect_timeout'));
  });
}));

export const close = () => {
  socket.close();
  socket = null;
};

export const emit = ({ eventName, data }) => {
  socket.emit(eventName, data);
};

export const on = ({ eventName, handler }) => {
  socket.on(eventName, (data) => {
    handler({ socket, data });
  });
};

export const waitForEvent = (eventName) => new Promise((resolve, reject) => {
  socket.once(eventName, (resolve));
  socket.once('disconnect', reject);
});

export const isConnected = () => socket && socket.connected;
