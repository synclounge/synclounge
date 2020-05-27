export default {
  user: {},
  username: null,
  signedin: false,

  clients: {},
  servers: {},

  itemCache: {},
  libraryCache: {},

  chosenClient: null,

  getRandomThumb: (state) => new Promise(async (resolve, reject) => {
    const validServers = {};
    for (const id in state.servers) {
      const server = state.servers[id];
      if (server.chosenConnection) {
        validServers[id] = server;
      }
    }
    if (Object.keys(validServers).length > 1) {
      const keys = Object.keys(validServers);
      const randomServer = validServers[keys[keys.length * Math.random() << 0]];
      try {
        const result = await randomServer.getRandomItem();
        if (!result) {
          return reject(new Error('No result found'));
        }
        return resolve(randomServer.getUrlForLibraryLoc(result.thumb, 900, 900, 8));
      } catch (e) {
        console.log(e);
        reject(e);
      }
    } else {
      reject(new Error('No valid servers found'));
    }
  }),
};
