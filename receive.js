const express = require('express');
const bodyParser= require('body-parser');
const multer = require('multer');
const app = express();
const os = require('os');
const path = require('path');
const WindowsToaster = require('node-notifier').WindowsToaster

const main = require('./main.js');
var server;

app.use(bodyParser.urlencoded({extended: true}))

var dir;
function setSaveDir(save) {
  if (save == 'Desktop'){
    dir = path.join(os.homedir(), '/Desktop');
  }
  else{
    dir = save;
  }
}
exports.setSaveDir = setSaveDir;

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

var key = Math.random().toString(36).slice(2);
var secretKey = main.secretKey;

function approval(req, res, next) {

  const goToNext = () => {
    key = Math.random().toString(36).slice(2);
    main.receiveBtn();
    setTimeout(next,1000)
  }

  let clientKey = req.get('key').replace(/\s/g,'');
  if (clientKey == key.replace(/\s/g,'')) {
    goToNext();
  }

  else if (clientKey == secretKey.replace(/\s/g,'') && secretKey != "unconfigured") {
    goToNext();
  }

  else {
    var notifier = new WindowsToaster()
    notifier.notify({
          title: req.get('hostname'),
          message: `would like to send ${req.get('filecount')} file(s).`,
          icon: path.join(__dirname, '/res/icon.ico'),
          actions: ['Accept', 'Dismiss'],
          wait: true
      });

    notifier.on('activate', goToNext);
    notifier.on('accept', goToNext);
    notifier.on('dismiss', function() {
      res.send('The transfer was cancelled!')
    })
  }
}

function beforeUpload(req, res, next) {
  var filedata = [req.get('filename'), req.get('hostname'), req.get('Content-Length')];
  main.checkShortcut(req.get('version'))
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
  res.send(key)
}

app.post('/uploadfile', [approval, beforeUpload, upload.single('single'), afterUpload]);
app.head('/airwave', function(req,res) {
  res.setHeader("airwave", "Send to PC");
  res.setHeader("hostname", os.hostname().replace(/[":,{}\s]+/g, ''))
  res.send("I see you snooping around.");
})

function startMulter(port)
{
  server = app.listen(port, () => console.log('Listening for files!'));
}

function stopMulter()
{
  server.close(function() {});
}

exports.startMulter = startMulter;
exports.stopMulter = stopMulter; 