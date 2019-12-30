const ipc = require('electron').ipcRenderer;

const config = require('../config.json');
document.getElementById('hotspotText').innerHTML += `Name: "${config.ssid}"<br>Passkey: "${config.password}"`;

var os= require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}
var parts = addresses[0].split('.');
var frontIp = `${parts[0]}.${parts[1]}.${parts[2]}.`
var backIp = parts[3];
document.getElementById('frontIp').innerHTML = frontIp;
document.getElementById('backIp').innerHTML = backIp;

function createHotspot() {
    ipc.send('hotspotOn', {});
    document.getElementById('ip').style.display = 'none';
    document.getElementById('wifiText').style.display = 'none';
    document.getElementById('qr').style.display = 'block';
    document.getElementById('hotspotText').style.display = 'block'; 
}

function closeBtn()
{
    ipc.send('cleanupRcv', {});
}

function cancelBtn()
{
    ipc.send('cancelRcv', {});
    document.getElementById('divInProgress').removeChild(document.getElementById('inProgress'));
    document.getElementById('btnCancel').style.display = "none";
    if (document.getElementsByClassName('received').length == 0) {
       document.getElementById('waiting').style.display = "block";
    }
}

function minimizeBtn()
{
    ipc.send('minimize', {});
    var minimize = document.getElementById('btnMin');
    minimize.setAttribute("src", "./res/up.png")
    minimize.setAttribute("onclick", "maximizeBtn();")
}

function maximizeBtn()
{
    ipc.send('maximize', {});
    var maximize = document.getElementById('btnMin');
    maximize.setAttribute("src", "./res/down.png")
    maximize.setAttribute("onclick", "minimizeBtn();")
}

ipc.on('inProgress', (event, filedata) => {
    document.getElementById('waiting').style.display = "none";
    document.getElementById('btnClose').style.display = "none";
    document.getElementById('btnCancel').style.display = "inline-block";
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    document.getElementById('divInProgress').innerHTML += `<table title="Receiving.." id="inProgress" class="inProgress" ><tr><td><img class="fileImg" src="./res/spinner.gif" width="20" height="20"></td><td class='uptext'>${filedata[0]}</td></tr><tr><td></td><td class='downtext'>${hostname} - ${size}</td></tr></table>`;
})

ipc.on('received', (event, filedata) => {
    document.getElementById('btnClose').style.display = "inline-block";
    document.getElementById('btnCancel').style.display = "none";
    document.getElementById('divInProgress').removeChild(document.getElementById('inProgress'));
    var parts = filedata[3].split('\\');
    filePath = parts.join('\\\\');
    if (filedata[1] == null) {
        alert('Your iOS shortcut appears to be corrupted. Please download it again.');
        hostname = 'Corrupted';
    }
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    document.getElementById('divReceived').innerHTML = `<table title="Open in Folder" class="received" onclick="openInFolder('${filePath}');"><tr><td><img class="fileImg" src="./res/file.png" width="25" height="25"></td><td class='uptext'>${filedata[0]}</td></tr><tr><td></td><td class='downtext'>${hostname} - ${size}</td></tr></table>` + document.getElementById('divReceived').innerHTML;
})

function openInFolder(path)
{
    const {shell} = require('electron');
    shell.showItemInFolder(path);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}