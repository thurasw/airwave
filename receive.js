const express = require('express');
const bodyParser= require('body-parser');
const multer = require('multer');
const app = express();
const os = require('os');
const path = require('path');

const main = require('./main.js');
var server;

var config = require('../config.json');
var save = 'default';

app.use(bodyParser.urlencoded({extended: true}))

var dir;
if (save == 'default'){
  dir = path.join(os.homedir(), '/Desktop');
}
else{
  dir = String(config.SaveDirectory);
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({ 
  storage: storage,
})

function beforeUpload(req, res, next) {
  var filedata = [req.get('filename'), req.get('hostname'), req.get('Content-Length')];
  main.inProgress(filedata);
  function cancel() {
    res.status(404).send('The transfer was cancelled!');
  }
  exports.cancel = cancel;
  next();
}

function afterUpload(req, res, next) { 
  var filedata = [req.file.originalname, req.get('hostname'), req.file.size, req.file.path];
  main.received(filedata);
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  //res.send(file)
  next();
}

app.post('/uploadfile', [beforeUpload, upload.single('single'), afterUpload]);

function startMulter()
{
  server = app.listen(3000, () => console.log('Listening for files!'));
}

function stopMulter()
{
  server.close(function() {});
}

exports.startMulter = startMulter;
exports.stopMulter = stopMulter; 