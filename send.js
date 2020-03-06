const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const path = require('path');

const main = require('./main.js');
var server;

app.use(bodyParser.urlencoded({extended: true}))

function startSend(filedata, port) {
    var names = filedata[0];
    var paths = filedata[1];
    app.get('/filedata', function(req, res) {
        res.send(names);
        var hostname = req.get('hostname');
        main.startSending([names.length, hostname]);
    });
    paths.forEach(function(path, index) { 
        var name = path.replace(/^.*[\\\/]/, '')
        app.get(`/${name.replace(/\s+/g, '')}`, function(req, res) {
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