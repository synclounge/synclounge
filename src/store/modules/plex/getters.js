export default {
    getItemCache: (state) => {
        return state.itemCache
    },
    getLibraryCache: (state) => {
        return state.libraryCache
    },
    recentClients: (state) => {
        let clients = []
        for (let client in state.clients) clients.push(state.clients[client])
        clients = clients.sort((a, b) => {
            return parseInt(b.lastSeenAt) - parseInt(a.lastSeenAt)
        })
        return clients
    }
};
