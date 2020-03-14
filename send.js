const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const path = require('path');
const os = require('os');

const main = require('./main.js');
var server;

app.use(bodyParser.urlencoded({extended: true}))
app.head('/airwave', function(req,res) {
    res.setHeader("airwave", "Receive from PC");
    res.setHeader("hostname", os.hostname().replace(/[":,{}\s]+/g, ''))
    res.send("I see you snooping around.");
  })

function startSend(filedata, port) {
    
    var names = filedata[0];
    var paths = filedata[1];
    app.locals.filedata = names;
    app.get('/filedata', function(req, res) {
        res.send(app.locals.filedata);
        var hostname = req.get('hostname');
        main.startSending([names.length, hostname]);
    });
    paths.forEach(function(path, index) { 
        var name = path.replace(/^.*[\\\/]/, '')
        app.get(`/${name.replace(/[^0-9a-zA-Z.,]/g, '')}`, function(req, res) {
            res.sendFile(path);
            main.sendUpdate([names.length, req.get('hostname')]);
        });
    });
    server = app.listen(port, () => console.log('Server set up for download!'));
}

exports.startSend = startSend;

function stopSend() {
    if (server !== undefined) {
        server.close(function() {});
    }
}
exports.stopSend = stopSend;