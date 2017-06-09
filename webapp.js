// ABOUT
// Runs the Plex Together Web App - handles serving the static web content and link shortening services
// Port defaults to 8088
// REQUIRED: --url argument

const args = require("args-parser")(process.argv)
if (!args['url']){
  console.log('Missing required argument -url. EG. "node webapp.js --url=http://example.com/ptweb". This URL is used for redirecting invite links.')
  return
}
var accessIp = args['url'] // EG 'http://95.231.444.12:8088/ptweb' or 'http://example.com/ptweb'
if (accessIp.indexOf('/ptweb') == -1){
  console.log('WARNING: /ptweb was not found in your url. Unless you have changed the URL Base make sure to include this.')
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
var httpProxy = require('http-proxy')
var proxy = httpProxy.createProxyServer({ ws: true });
var jsonfile = require('jsonfile')
var file = 'ptinvites.json'

var root = express()

var combined = express()

var webapp = express();

// Setup our web app
webapp.use('/',express.static(path.join(__dirname, 'dist')));


// Merge everything together

webapp.get('/invite/:id',function(req,res){
    console.log('handling an invite')
    let shortObj = shortenedLinks[req.params.id]
    if (!shortObj){
        return res.send('Invite expired')
    }
    console.log('Redirecting an invite link')
    console.log(JSON.stringify(shortObj,null,4))
    return res.redirect(shortObj.fullUrl)
})
root.use('/ptweb',webapp)
root.get('*',function(req,res){
    console.log('Catch all - have you run `npm run build`?')
    return res.redirect('/ptweb')
})



root.use(cors())

var rootserver = require('http').createServer(root);

var webapp_io = require('socket.io')(rootserver,{path: '/ptweb/socket.io'});

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
    if (data.ptpassword){
        params.ptpassword = data.ptpassword
    }
    let query = ''
    for (let key in params) {
        query += encodeURIComponent(key)+'='+encodeURIComponent(params[key])+'&';
    }
    returnable.fullUrl = accessIp + '/#/join?' + query

    shortenedLinks[returnable.id] = returnable
    saveToFile(shortenedLinks,()=>{})
    return returnable.shortUrl
}

webapp_io.on('connection', function(socket){
    console.log('New connection to the webapp socket')
    socket.on('shorten',function(data){
        console.log('Creating a shortened link')
        socket.emit('shorten-result',shortenObj(data))
    })
})

function saveToFile(content,callback){
    jsonfile.writeFile(file, content, function (err) {
        return callback(err)
    })
}

function loadFromFile(callback){
    jsonfile.readFile(file, function(err, obj) {
        if (err || !obj){
            // File doesn't exist or an error occured
            return callback({})
        } else {
            return callback(obj)
        }
    })
}


var shortenedLinks = {}
loadFromFile((result) => {
    console.log(result)
    shortenedLinks = result
    rootserver.listen(PORT);
})

console.log('PlexTogether WebApp successfully started on port ' + PORT)






