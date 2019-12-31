const { app, Menu, Tray, screen, shell, BrowserWindow, dialog, remote} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');
const exec = require('child_process').exec;
const {autoUpdater} = require('electron-updater');
const log = require("electron-log");

var config = require('../config.json');
var ssid = config.ssid;
var password = config.password;
var legacy = config.legacyMode;
var dirty = false;
let tray = undefined;
let window = undefined;

function generateQr() {
    const qr = require('qrcode');
    var fs = require('fs');
    var filepath = path.join(__dirname, "../qr.png")
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) {
                alert("An error ocurred updating the file" + err.message);
                console.log(err);
                return;
            }
        });
    qr.toFile(path.join(__dirname, "../qr.png"), `WIFI:T:WPA;S:${ssid};P:${password};;`);
    }
}

app.on('ready', () => {
    createWindow();
    createTray();
    autoUpdater.checkForUpdates();
})

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

autoUpdater.on('update-available', () => {
    log.info('Checking..');
    dialog.showMessageBox({
        type: 'info',
        button: [],
        title: 'Airwave',
        message: 'An update for Airwave is available and is being downloaded!',
    })
})
autoUpdater.on('update-downloaded', () => {
    log.info('Downloaded..');
    dialog.showMessageBox({
        type: 'info',
        button: ['Update and Restart', 'Dismiss'],
        title: 'Airwave',
        message: 'The update has been downloaded!',
        detail: 'Do you want to install it now?',
        cancelId: 1,
    }, (res) => {
        if (res === 0) {
            autoUpdater.quitAndInstall();
        }
    })
})

function adjustWindow()
{
    var position = getWindowPosition();
    window.setPosition(position.x, position.y, false);
}

const showWindow = () => {
    adjustWindow();
    window.show();
}

const getWindowPosition = () => {
    const windowBounds = window.getBounds();
    const trayBounds = tray.getBounds();
    let screenBounds = screen.getPrimaryDisplay();
    
    const x = Math.round(screenBounds.bounds.width - windowBounds.width)

    const y = Math.round(screenBounds.bounds.height - windowBounds.height - trayBounds.height)
    return {x: x, y: y}
}

const createWindow = () => {
    window = new BrowserWindow({
        width: 300,
        height: 55,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        transparent: true,
        skipTaskbar: true,
        alwaysOnTop:true,
        minimizable:false,
        backgroundColor: '#161616',
        webPreferences: 
        {
            nodeIntegration: true
        }
    });
    window.loadURL(`file://${__dirname}/index.html`);
    //window.webContents.openDevTools();
}

const createTray = () => {
    tray = new Tray(`${__dirname}\\res\\icon.ico`);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'About', type: 'normal', 
            click() {
                shell.openExternal('https://github.com/thura10/airwave')
            } 
        },
        { label: 'Check for Updates', type: 'normal', 
            click() {
                autoUpdater.checkForUpdatesAndNotify();
            } 
        },
        { label: 'Config..', type: 'normal', 
            click() {
                shell.openItem(path.join(__dirname, "../config.json"))
            } 
        },
        { label: 'README', type: 'normal', 
            click() {
                shell.openItem(path.join(__dirname, "../readme.txt"))
            } 
        },
        { label: 'Regenerate QR', type: 'normal', 
            click() {
                generateQr();
            } 
        },
        { label: 'Donate! :)', type: 'normal',
            click() {
                shell.openExternal('https://paypal.me/thurasw')
            }
        },
        { label: 'Exit', type: 'normal', role: 'quit' }
      ])
    tray.setToolTip('Share or Receive files from iOS.')
    tray.setContextMenu(contextMenu)
    tray.on('click', function (event) {
        if (dirty==false){
            toggleWindow();
        }
    })
}

const toggleWindow = () => {
    if (window.isVisible() == true) {
        window.hide();
    }
    else {
        showWindow();
    }
}

function execute(command, callback) {
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};
var wifi;
function turnOnHotspot()
{   
    if (legacy == 'false') {
        var fs = require('fs');

        fs.writeFile(path.join(__dirname, "../ssid"), `${ssid}`, function (err) {
            if (err) throw err;
            console.log('File is created successfully.');
        });
        fs.writeFile(path.join(__dirname, "../pass"), `${password}`, function (err) {
            if (err) throw err;
            console.log('File is created successfully.');
        });
        const { exec } = require('child_process');
        wifi = exec('wifi.exe',{ cwd: `${path.join(__dirname, '..')}`}, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                return;
            }
        console.log(stdout);
        });
    }
    else {
        execute(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd c:\ && netsh wlan stop hostednetwork && NETSH WLAN set hostednetwork mode=allow ssid=${ssid} key=${password} && netsh wlan start hostednetwork'"`, console.log)
    }
}

function turnOffHotspot()
{
    if (legacy == 'false'){
        if(wifi !== undefined) {
            wifi.kill('SIGTERM');
        }
    }
    else{
        execute(`netsh wlan stop hostednetwork`, console.log);
    }
}

ipc.on('hotspotOn', function(event, data) {
    turnOnHotspot();
});

ipc.on('receiveBtn', function(event, data)
{
    var receive = require('./receive.js');
    dirty = true;
    receive.startMulter();
    bigBrowser();
    window.loadURL(`file://${__dirname}/receive.html`);
});

ipc.on('cancelRcv', function(event, data) {
    var receive = require('./receive.js');
    receive.stopMulter();
    receive.cancel();
    receive.startMulter();
});

ipc.on('minimize', function(event, data) {
    smallBrowser(100);
})

ipc.on('maximize', function(event, data) {
    bigBrowser();
})

ipc.on('cleanupRcv', function(event, data)
{
    var receive = require('./receive.js');
    smallBrowser(55);
    turnOffHotspot();
    window.loadURL(`file://${__dirname}/index.html`);
    adjustWindow();
    receive.stopMulter();
    dirty = false;
});

function received(filedata)
{
    window.webContents.send('received', filedata);
}
exports.received = received;

function inProgress(filedata) {
    window.webContents.send('inProgress', filedata);
}
exports.inProgress = inProgress;

function bigBrowser()
{
    window.setSize(300, 400, true);
    adjustWindow();
}

function smallBrowser(height)
{
    window.setMinimumSize(300, height);
    window.setSize(300, height, true);
    adjustWindow();
}

ipc.on('sendBtn', function(event, message) {
    dirty = true;
    bigBrowser();
    window.loadURL(`file://${__dirname}/fileSelect.html`);
})

ipc.on('fileSend', function(event, filedata) {
    var send= require('./send.js');
    send.startSend(filedata);
    window.loadURL(`file://${__dirname}/send.html`);
})

ipc.on('cleanupSend', function(event, message) {
    turnOffHotspot();
    var send = require('./send.js');
    send.stopSend();
    smallBrowser(55);
    window.loadURL(`file://${__dirname}/index.html`);
    adjustWindow();
    dirty = false;
})

function startSending(message) {
    window.webContents.send('startSending', message);
}
function sendUpdate(message) {
    window.webContents.send('sendUpdate', message);
}
exports.startSending = startSending;
exports.sendUpdate = sendUpdate;