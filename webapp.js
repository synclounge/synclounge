// ABOUT
// Runs the SyncLounge Web App - handles serving the static web content and link shortening services
// Port defaults to 8088
// REQUIRED: --url argument

const settings = require('./settings.json')

const args = require('args-parser')(process.argv)
if (!args['url']) {
    console.log('Missing required argument -url. EG. "node webapp.js --url=http://example.com/ptweb". This URL is used for redirecting invite links.')
    return
}
var accessIp = args['url'] // EG 'http://95.231.444.12:8088/ptweb' or 'http://example.com/ptweb'
if (accessIp.indexOf('/ptweb') == -1) {
    console.log('WARNING: /ptweb was not found in your url. Unless you have changed the URL Base make sure to include this.')
}
var PORT = 8088
if (args['port']) {
    PORT = parseInt(args['port'])
} else {
    console.log('Defaulting to port 8088')
}

var express = require('express')
var path = require('path')
var cors = require('cors')
var jsonfile = require('jsonfile')
var bodyParser = require('body-parser')
var file = 'ptinvites.json'


var root = express()
root.use(bodyParser())
// root.use(bodyParser.urlencoded({ extended: true }))

// Setup our web app
root.use('/' + settings.webroot + '/', express.static(path.join(__dirname, 'dist')))


// Merge everything together

root.get('/' + settings.webroot + '/invite/:id', (req, res) => {
    console.log('handling an invite')
    let shortObj = shortenedLinks[req.params.id]
    if (!shortObj) {
        return res.send('Invite expired')
    }
    console.log('Redirecting an invite link')
    console.log(JSON.stringify(shortObj, null, 4))
    return res.redirect(shortObj.fullUrl)
})
root.post('/' + settings.webroot + '/invite', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (!req.body) {
        return res.send({
            success: false,
            msg: 'ERR: You did not send any POST data'
        }).end()
    }
    console.log('Generating Invite URL via the API.')
    let data = {}
    let fields = ['server', 'room', 'password', 'owner']
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
root.use('/', express.static(path.join(__dirname, 'dist')))

root.get('*', (req, res) => {
    console.log('Catch all')
    return res.redirect('/')
})



root.use(cors())

var rootserver = require('http').createServer(root)

var webapp_io = require('socket.io')(rootserver, {
    path: '/' + settings.webroot + '/socket.io'
})

function getUniqueId() {
    while (true) {
        let testId = (0 | Math.random() * 9e6).toString(36)
        if (!shortenedLinks[testId]) { // Check if we already have a shortURL using that id
            return testId
        }
    }

}

function shortenObj(data) {
    let returnable = {}
    returnable.urlOrigin = accessIp
    returnable.owner = data.owner

    returnable.ptserver = data.ptserver
    returnable.ptroom = data.ptroom
    returnable.ptpassword = data.ptpassword

    returnable.starttime = (new Date).getTime()
    returnable.id = getUniqueId()
    returnable.shortUrl = accessIp + '/invite/' + returnable.id

    let params = {
        ptserver: data.ptserver,
        ptroom: data.ptroom,
        owner: data.owner
    }
    if (data.ptpassword) {
        params.ptpassword = data.ptpassword
    }
    let query = ''
    for (let key in params) {
        query += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
    }
    returnable.fullUrl = accessIp + '/#/join?' + query

    shortenedLinks[returnable.id] = returnable
    saveToFile(shortenedLinks, () => {})
    return returnable.shortUrl
}

webapp_io.on('connection', (socket) => {
    console.log('New connection to the webapp socket')
    socket.on('shorten', (data) => {
        console.log('Creating a shortened link')
        socket.emit('shorten-result', shortenObj(data))
    })
})

function saveToFile(content, callback) {
    jsonfile.writeFile(file, content, (err) => {
        return callback(err)
    })
}

function loadFromFile(callback) {
    jsonfile.readFile(file, (err, obj) => {
        if (err || !obj) {
            // File doesn't exist or an error occured
            return callback({})
        } else {
            return callback(obj)
        }
    })
}

function killOldInvites() {
    let now = (new Date).getTime()
    loadFromFile((data) => {
        if (!data) {
            return
        }
        console.log('Deleting invites over 1 month old..')
        let oldSize = Object.keys(data).length
        for (let key in data) {
            let invite = data[key]
            if (Math.abs(invite.starttime - now) > 2629746000) {
                delete data[key]
            }
        }
        console.log('Deleted ' + Math.abs(oldSize - Object.keys(data).length) + ' old invites')
        saveToFile(data, () => {})
    })
}
killOldInvites()
setInterval(() => {
    killOldInvites()
}, 3600000)

var shortenedLinks = {}
loadFromFile((result) => {
    shortenedLinks = result
    rootserver.listen(PORT)
})

console.log('SyncLounge WebApp successfully started on port ' + PORT)
