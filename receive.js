const express = require('express');
const bodyParser= require('body-parser');
const multer = require('multer');
const app = express();
const os = require('os');
const path = require('path');
var server;

var config = require('../config.json');
var save = config.saveDirectory;

app.use(bodyParser.urlencoded({extended: true}))

if (save == 'default'){
  dir = path.join(os.homedir(), '/Desktop');
}
else{
  dir = config.SaveDirectory;
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

app.post('/uploadfile', upload.single('single'),(req, res, next) => {
    const main = require('./main.js');
    var filedata = [req.file.originalname, req.get('hostname'), req.file.size, req.file.path];
    main.inProgress(filedata);
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
      res.send(file)
    
  })

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