// ABOUT
// Runs the SyncLounge Web App - handles serving the static web content and link shortening services
// Port defaults to 8088
// REQUIRED: --url argument

const args = require("args-parser")(process.argv)
if (!args['url']){
  console.log('Missing required argument -url. EG. "node webapp.js --url=http://example.com/slweb". This URL is used for redirecting invite links.')
  return
}
var accessIp = args['url'] // EG 'http://95.231.444.12:8088/slweb' or 'http://example.com/slweb'
if (accessIp.indexOf('/slweb') == -1){
  console.log('WARNING: /slweb was not found in your url. Unless you have changed the URL Base make sure to include this.')
}
var PORT = 8088
if (args['port']){
  PORT = parseInt(args['port'])
} else {
  console.log('Defaulting to port 8088')
}

var express = require('express');
var path = require('path');
var cors = require('cors')
var jsonfile = require('jsonfile')
var bodyParser = require('body-parser')
var file = 'ptinvites.json' 


var root = express()
root.use( bodyParser() )
// root.use(bodyParser.urlencoded({ extended: true }))

// Setup our web app
root.use('/slweb/', express.static(path.join(__dirname, 'dist')));


// Merge everything together

root.get('/slweb/invite/:id', (req,res) => {
    console.log('handling an invite')
    let shortObj = shortenedLinks[req.params.id]
    if (!shortObj){
        return res.send('Invite expired')
    }
    console.log('Redirecting an invite link')
    console.log(JSON.stringify(shortObj, null, 4))    
    return res.redirect(shortObj.fullUrl)
})
root.post('/slweb/invite', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (!req.body) {
        return res.send({
            success: false,
            msg: 'ERR: You did not send any POST data'
        }).end()
    }
    console.log('Generating Invite URL via the API.')
    let data = {}
    let fields = ['slserver', 'slroom', 'slpassword', 'owner']
    for (let i = 0; i < fields.length; i++) {
        if (!req.body[fields[i]]) {
            return res.send({
                success: false,
                msg: 'ERR: You did not specify ' + fields[i],
                field: fields[i]
            }).end()
        }
        data[fields[i]] = req.body[fields[i]]
    }
    return res.send({
        url: shortenObj(data),
        success: true,
        generatedAt: new Date().getTime(),
        details: data
    }).end()



})
root.use('/',express.static(path.join(__dirname, 'dist')))

root.get('/ptweb',(req,res) => {
    console.log('ptweb redirect')
    return res.redirect('/slweb')
})

root.get('*',(req, res) => {
    console.log('Catch all', req.url)
    return res.redirect('/slweb')
})



root.use(cors())

var rootserver = require('http').createServer(root);

var webapp_io = require('socket.io')(rootserver, { path: '/slweb/socket.io'} )

function getUniqueId(){
    while (true){
        let testId = (0|Math.random()*9e6).toString(36)
        if (!shortenedLinks[testId]){    // Check if we already have a shortURL using that id
            return testId
        }
    }

}

function shortenObj(data){
    let returnable = {}
    returnable.urlOrigin = accessIp
    returnable.owner = data.owner

    returnable.slserver = data.slserver
    returnable.slroom = data.slroom
    returnable.slpassword = data.slpassword

    returnable.starttime = (new Date).getTime()
    returnable.id = getUniqueId()
    returnable.shortUrl = accessIp + '/invite/' + returnable.id

    let params = {
        slserver: data.slserver,
        slroom: data.slroom,
        owner: data.owner
    }
    if (data.slpassword){
        params.slpassword = data.slpassword
    }
    let query = ''
    for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
    }
    returnable.fullUrl = accessIp + '/#/join?' + query

    shortenedLinks[returnable.id] = returnable
    saveToFile(shortenedLinks, () => {})
    return returnable.shortUrl
}

webapp_io.on('connection', (socket) => {
    console.log('New connection to the webapp socket')
    socket.on('shorten',(data) => {
        console.log('Creating a shortened link')
        socket.emit('shorten-result', shortenObj(data))
    })
})

function saveToFile(content,callback){
    jsonfile.writeFile(file, content, (err) => {
        return callback(err)
    })
}

function loadFromFile(callback){
    jsonfile.readFile(file, (err, obj) => {
        if (err || !obj){
            // File doesn't exist or an error occured
            return callback({})
        } else {
            return callback(obj)
        }
    })
}

function killOldInvites(){
    let now = (new Date).getTime()
    loadFromFile((data) => {
        if (!data){
            return
        }
        console.log('Deleting invites over 1 month old..')
        let oldSize = Object.keys(data).length
        for (let key in data){
            let invite = data[key]
            if (Math.abs(invite.starttime - now) > 2629746000){
                delete data[key]
            }
        }
        console.log('Deleted ' + Math.abs(oldSize - Object.keys(data).length) + ' old invites')
        saveToFile(data,()=>{})
    })
}
killOldInvites()


var shortenedLinks = {}
loadFromFile((result) => {
    shortenedLinks = result
    const cluster = require('cluster');
    const http = require('http');
    const numCPUs = require('os').cpus().length;
        
    // if (cluster.isMaster) {
    //   // Fork workers.
    //     setInterval(() => {
    //         if (cluster.isMaster) {
    //             killOldInvites()
    //         }
    //     }, 3600000)
    //   for (let i = 0; i < numCPUs; i++) {
    //     cluster.fork();
    //   }
    
    //   cluster.on('exit', (thread, code, signal) => {
    //     console.log(`thread ${thread.process.pid} died`, code, signal)
    //   });
    // } else {
    //     rootserver.listen(PORT)
    // } 
    rootserver.listen(PORT)     
})

console.log('SyncLounge WebApp successfully started on port ' + PORT)






