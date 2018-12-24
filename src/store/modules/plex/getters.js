export default {
  getItemCache: state => state.itemCache,
  getLibraryCache: state => state.libraryCache,
  recentClients: (state) => {
    let clients = [];
    for (const client in state.clients) clients.push(state.clients[client]);
    clients = clients.sort((a, b) => parseInt(b.lastSeenAt) - parseInt(a.lastSeenAt));
    return clients;
  },
};
