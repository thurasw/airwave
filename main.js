const { app, Menu, Tray, screen, shell, BrowserWindow, dialog, remote} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');
const exec = require('child_process').exec;

var config = require('../config.json');
var ssid = config.ssid;
var password = config.password;
var legacy = config.legacyMode;
var dirty = false;
let tray = undefined
let window = undefined

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
            console.log("File succesfully deleted");
        });
    qr.toFile(path.join(__dirname, "../qr.png"), `WIFI:T:WPA;S:${ssid};P:${password};;`);
    }
}

app.on('ready', () => {
    createWindow();
    createTray();
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
    window.webContents.openDevTools();
}

const createTray = () => {
    tray = new Tray(`${__dirname}\\res\\icon.ico`);
    const contextMenu = Menu.buildFromTemplate([
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
function turnOnHotspot()
{   
    var stdout;
    function callback(stdout) {
        console.log(stdout)
        if (stdout.includes("Success")== true) {
            }
        else {
            dialog.showMessageBox(null, {
                title: 'Error turning on Mobile Hotspot',
                message: 'An error occurred while trying to turn on Mobile Hotspot.',
                detail: 'This is most likely due to your PC not being connected to any WiFi Network. You can try turning on Legacy Mode in config to continue without WiFi, although this is slower and not supported in some PCs'
            })
        }
    }
    if (legacy == 'false'){
        execute(`powershell -ExecutionPolicy Bypass -File ${path.join(__dirname, "../hotspotOn.ps1")}`, callback);
    }
    else {
        execute(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd c:\ && netsh wlan stop hostednetwork && NETSH WLAN set hostednetwork mode=allow ssid=${ssid} key=${password} && netsh wlan start hostednetwork'"`, console.log)
    }
}  
function turnOffHotspot()
{
    if (legacy == 'false'){
        execute(`powershell -ExecutionPolicy Bypass -File ${path.join(__dirname, "../hotspotOff.ps1")}`, console.log)
    }
    else{
        execute(`netsh wlan stop hostednetwork`, console.log);
    }
}

ipc.on('receiveBtn', function(event, data)
{
    var receive = require('./receive.js');
    dirty = true;
    turnOnHotspot();
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
    //turnOnHotspot();
    var send= require('./send.js');
    send.startSend(filedata);
    window.loadURL(`file://${__dirname}/send.html`);
})

ipc.on('cleanupSend', function(event, message) {
    //turnOffHotspot();
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