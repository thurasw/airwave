const { app, Menu, Tray, screen, shell, BrowserWindow} = require('electron');
const ipc = require('electron').ipcMain;
const path = require('path');
const exec = require('child_process').exec;
const qr = require('qrcode');
var receive = require('./receive.js');
var fs = require('fs');
require('electron-reload')(__dirname);

var config = require('./config.json');
var save = config.SaveDirectory;
var ssid = config.ssid;
var password = config.password;

var dirty = false;
let tray = undefined
let window = undefined

function generateQr() {
    var filepath = `${__dirname}/src/qr.png`
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) {
                alert("An error ocurred updating the file" + err.message);
                console.log(err);
                return;
            }
            console.log("File succesfully deleted");
        });
    qr.toFile('./src/qr.png', `WIFI:T:WPA;S:${ssid};P:${password};;`);
    }
}

app.on('ready', () => {
    createWindow();
    createTray();
    exports.window= window;
})

function adjustWindow()
{
    var position = getWindowPosition();
    window.setPosition(position.x, position.y, false);
}

const showWindow = () => {
    window.show();
    adjustWindow();
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
    tray = new Tray(`${__dirname}\\src\\icon.ico`);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Config..', type: 'normal', 
            click() {
                shell.openItem(`${__dirname}/config.json`)
            } 
        },
        { label: 'README', type: 'normal', 
            click() {
                shell.openItem(`${__dirname}/info.txt`)
            } 
        },
        { label: 'Regenerate QR', type: 'normal', 
            click() {
                generateQr();
            } 
        },
        { label: 'Donate! :)', type: 'normal', role: '' },
        { label: 'Reload', type: 'normal', role: 'forceReload' },
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
    window.isVisible() ? window.hide() : showWindow();
}

function execute(command, callback) {
    exec(command);
};
function turnOnHotspot()
{
    execute(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd c:\ && netsh wlan stop hostednetwork && NETSH WLAN set hostednetwork mode=allow ssid=${ssid} key=${password} && netsh wlan start hostednetwork'"`)
}
function turnOffHotspot()
{  
    execute(`netsh wlan stop hostednetwork`)
}

ipc.on('receive-file', function(event, data)
{
    dirty = true;
    turnOnHotspot();
    receive.startMulter();
    receiveBrowser();
});

function inProgress(filedata)
{
    window.webContents.send('inProgress', filedata);
}
exports.inProgress = inProgress;

function receiveBrowser()
{
    window.setSize(300, 400, true);
    adjustWindow();
    window.loadURL(`file://${__dirname}/receive.html`);
}

function cleanup()
{
    turnOffHotspot();
    window.setMinimumSize(300, 55);
    window.loadURL(`file://${__dirname}/index.html`);
    window.setSize(300, 55, true);
    adjustWindow();
    receive.stopMulter();
    dirty = false;
}

ipc.on('cleanup', function(event, data)
{
    cleanup();
});