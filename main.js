const { app, Menu, Tray, screen, shell, BrowserWindow, dialog, remote} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');
const exec = require('child_process').exec;
const {autoUpdater} = require('electron-updater');
const log = require("electron-log");
var app_version = require('./package.json').version;

const shortcut_versions = ['2.0']

function checkShortcut(client_version) {
    if (!shortcut_versions.includes(client_version)) {
        window.webContents.send('incompatible')
    }
}
exports.checkShortcut = checkShortcut

const Store = require('electron-store');
const schema = {
    saveDir: {
        type: 'string',
        default: 'Desktop',
    },
    legacy: {
        type: 'boolean',
        default: false,
    },
    ssid: {
        type: 'string',
        default: 'airwave',
    },
    password: {
        type: 'string',
        default: 'sharepassword12345'
    },
    checkForUpdate: {
        type: 'boolean',
        default: true,
    },
    port: {
        type: 'number',
        maximum: 65535,
		minimum: 1,
		default: 3000
    }
};
const store = new Store({schema});
var config = [store.get('saveDir'), store.get('legacy'), store.get('ssid'), store.get('password'), store.get('checkForUpdate'), store.get('port')]
ipc.on('reqConfig', function(event) {
    window.webContents.send('config', config);
})

ipc.on('configSaved', function(event, newConfig) {
    store.set('saveDir', newConfig[0]);
    store.set('legacy', newConfig[1]);
    store.set('ssid', newConfig[2]);
    store.set('password', newConfig[3]);
    store.set('checkForUpdate', newConfig[4]);
    store.set('port', newConfig[5]);
    isInProgress = false;
    app.relaunch();
    generateQr(app.quit)
})

var saveDir = store.get('saveDir');
var legacy = store.get('legacy');
var ssid = store.get('ssid');
var password = store.get('password');
var autoUpdateSetting = store.get('checkForUpdate');
var portNumber = store.get('port');

var manualCheckForUpdate = false;
var isInProgress = false;
let tray = undefined;
let window = undefined;

function generateQr(callback) {
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
    callback();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit()
} 
else 
{
    app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
        toggleWindow();
    })
  
    // Create myWindow, load the rest of the app, etc...
    app.on('ready', () => {
        //createWindow();
        createTray();
        if (autoUpdateSetting !== false) {
            autoUpdater.checkForUpdates();
        }
    })
}
// don't close the app after all windows are closed.
app.on('window-all-closed', e => e.preventDefault() )

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
        if (result.response === 0) {
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
    var x; var y;
    if (trayBounds.y ==0) {
        x = Math.round(screenBounds.bounds.width - windowBounds.width)
        y = Math.round(trayBounds.height)    
    }
    else if (screenBounds.bounds.height == screenBounds.workArea.height) {
        if (screenBounds.workArea.x == 0) {
            x = Math.round(screenBounds.bounds.width - windowBounds.width - (screenBounds.bounds.width - screenBounds.workArea.width))
            y = Math.round(screenBounds.bounds.height - windowBounds.height)        
        }
        else {
            x = Math.round(screenBounds.workArea.x)
            y = Math.round(screenBounds.bounds.height - windowBounds.height)        
        }
    }
    else {
        x = Math.round(screenBounds.bounds.width - windowBounds.width)
        y = Math.round(screenBounds.bounds.height - windowBounds.height - trayBounds.height)    
    }
    
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
    window.loadURL(`file://${__dirname}/public/index.html`);
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
        { label: 'Settings', type: 'normal', 
        click() {
            if (isDestroyed) {
                createWindow();
                isDestroyed = false;
            }
            if (!isInProgress) {
                isInProgress = true;
                bigBrowser();
                window.loadURL(`file://${__dirname}/public/settings.html`);
                showWindow();
            }
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
        if (!isInProgress){
            toggleWindow();
        }
    })
}

var isDestroyed = true;
const toggleWindow = () => {
    if (isDestroyed) {
        createWindow();
        showWindow();
        isDestroyed = false;
    }
    else {
        window.destroy();
        isDestroyed = true;
    }
}

function execute(command, callback) {
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};
var wifi;
function turnOnHotspot()
{   
    if (legacy == false) {
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
    else {
        execute(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd c:\ && netsh wlan stop hostednetwork && NETSH WLAN set hostednetwork mode=allow ssid=${ssid} key=${password} && netsh wlan start hostednetwork'"`)
    }
}

function turnOffHotspot()
{
    if (legacy == false){
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
    if (data == 'receive') {
        receive.stopMulter();
        receive.startMulter();
    }

});

var receive = require('./receive.js');
receive.setSaveDir(saveDir);
receive.startMulter(portNumber);

function receiveBtn() {
    if (isDestroyed) {
        toggleWindow();
    }
    if (!isInProgress) {
        isInProgress = true;
        bigBrowser();
        window.loadURL(`file://${__dirname}/public/receive.html`);
    }
}
exports.receiveBtn = receiveBtn;

ipc.on('receiveBtn', receiveBtn);

ipc.on('cancelRcv', function(event, data) {
    turnOffHotspot();
    receive.stopMulter();
    receive.startMulter(portNumber);
});

ipc.on('minimize', function(event, data) {
    smallBrowser(120);
})

ipc.on('maximize', function(event, data) {
    bigBrowser();
})

ipc.on('cleanupRcv', function(event, data)
{
    turnOffHotspot();
    window.loadURL(`file://${__dirname}/public/index.html`);
    smallBrowser(55);
    adjustWindow();
    isInProgress = false;
});

function received(filedata)
{
    window.webContents.send('received', filedata);
}
exports.received = received;

ipc.on('inProgress', function(event, message) {
    inProgress(message);
    received(message)
})

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
    isInProgress = true;
    receive.stopMulter();
    bigBrowser();
    window.loadURL(`file://${__dirname}/public/fileSelect.html`);
})

ipc.on('fileSend', function(event, filedata) {
    var send= require('./send.js');
    send.startSend(filedata, portNumber);
    window.loadURL(`file://${__dirname}/public/send.html`);
})

ipc.on('cleanupSend', function(event, message) {
    turnOffHotspot();
    var send = require('./send.js');
    send.stopSend();
    window.loadURL(`file://${__dirname}/public/index.html`);
    smallBrowser(55);
    adjustWindow();
    isInProgress = false;

    receive.setSaveDir(saveDir);
    receive.startMulter(portNumber);
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
    if (isDestroyed) {
        createWindow();
        isDestroyed = false;
    }
    if (!isInProgress) {
        showWindow();
        window.loadURL(`file://${__dirname}/public/aboutQR.html`);
        bigBrowser();
        isInProgress = true;
    }
}
ipc.on('openGithub', function(event, message) {
    shell.openExternal('https://github.com/thura10/airwave')
})