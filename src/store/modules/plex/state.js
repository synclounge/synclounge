export default {
    user: {},
    username: null,
    signedin: false,
    
    clients: {},
    servers: {},

    chosenClient: null,

    getRandomThumb: (state) => {
        console.log('Getting random thumb', state)
        return new Promise(async (resolve, reject) => {
            let validServers = {}
            for (let id in state.servers) {
                let server = state.servers[id]
                if (server.chosenConnection) {
                    validServers[id] = server
                }
            }
            console.log('Valid servers', validServers)
            if (Object.keys(validServers).length > 1){
                
                let keys = Object.keys(validServers)
                let randomServer = validServers[keys[ keys.length * Math.random() << 0]]
                console.log('Getting random thumb from', randomServer)
                try {
                    let result = await randomServer.getRandomItem()
                    if (!result){
                        return reject(false)
                    }
                    return resolve(randomServer.getUrlForLibraryLoc(result.thumb, 900, 900, 8))
                } catch (e) {
                    console.log(e)
                    reject(e)
                }                
            } else {
                reject()
            }
        })
    },
};
