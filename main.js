const { app, Menu, Tray, screen, shell, BrowserWindow, dialog, remote} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');
const exec = require('child_process').exec;
const {autoUpdater} = require('electron-updater');
const log = require("electron-log");
var app_version = require('./package.json').version;

var config = require('../config.json');
var ssid = config.ssid;
var password = config.password;
var legacy = config.legacyMode;
var autoUpdateSetting = config.checkForUpdate;
var hideDonate = config.hideDonate;

var manualCheckForUpdate = false;
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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit()
} 
else 
{
    app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
        showWindow();
    })
  
    // Create myWindow, load the rest of the app, etc...
    app.on('ready', () => {
        createWindow();
        createTray();
        if (autoUpdateSetting !== false) {
            autoUpdater.checkForUpdates();
        }
    })
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

autoUpdater.on('error', (err) => {
    log.error(err);
})
autoUpdater.on('update-available', () => {
    log.info('Update available. Downloading now...');
    dialog.showMessageBox({
        type: 'info',
        buttons: ['Ok', 'Download Shortcuts'],
        title: 'Airwave',
        message: 'An update for Airwave is available and is being downloaded!',
        detail: 'You should get the updated shortcuts from the github link below as well.',
    }).then(result => {
        if (result.response === 1) {
            githubQr();
        }
    })
})
autoUpdater.on('update-not-available', () => {
    log.info('No updates found!');
    if (manualCheckForUpdate == true) {
        dialog.showMessageBox({
            type: 'info',
            button: [],
            title: 'Airwave',
            message: 'No updates found!',
        })
        manualCheckForUpdate == false;
    }
})
autoUpdater.on('update-downloaded', () => {
    log.info('Downloaded..');
    dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['Update and Restart', 'Dismiss'],
        title: 'Airwave',
        message: 'The update has been downloaded!',
        detail: 'Do you want to install it now?',
        cancelId: '1'
    }).then(result => {
        if (result.response === 1) {
            autoUpdater.quitAndInstall();
        }
    });
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
        { label: `About (${app_version})`, type: 'normal', 
            click() {
                shell.openExternal('https://github.com/thura10/airwave')
            } 
        },
        { label: `Download Shortcuts`, type: 'normal', 
            click() {
                githubQr();
            } 
        },
        { label: 'Check for Updates', type: 'normal', 
            click() {
                autoUpdater.checkForUpdates();
                manualCheckForUpdate == true;
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
        child = require('child_process').execFile('wifi.exe', [], { 
            cwd: `${path.join(__dirname, '..')}`,
            detached: true, 
            stdio: [ 'ignore', 1, 2 ]
        }); 
        
        child.unref(); 
        child.stdout.on('data', function(data) {
            var stdout = data.toString();
            if (stdout.includes('Peers can connect to')) {
                log.info('Hotspot created! Please ignore any error messsges relating to this during this period.')
            }
            else {
                log.info("Hotspot not created yet! This isn't neccesarily an error so long as you see a success message below.")
                log.info(stdout);
            }
        });
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
    receive.cancel();
    receive.stopMulter();
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

function githubQr() {
    if (dirty == false) {
        showWindow();
        window.loadURL(`file://${__dirname}/public/aboutQR.html`);
        bigBrowser();
    }
}
ipc.on('openGithub', function(event, message) {
    shell.openExternal('https://github.com/thura10/airwave')
})