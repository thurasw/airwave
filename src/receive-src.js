const ipc = require('electron').ipcRenderer;

var hotspotText = document.getElementById('hotspotText');
var wifiText = document.getElementById('wifiText');
var btnCancel = document.getElementById('btnCancel');
var btnClose = document.getElementById('btnClose');
var divInProgress = document.getElementById('divInProgress');

ipc.send('reqConfig', {});
ipc.on('config', function(event, reqConfig) {
  var ssid = reqConfig[2];
  var password = reqConfig[3];
  hotspotText.innerHTML += `Name: "${ssid}"<br>Passkey: "${password}"`;
})

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
if (addresses.length == 0) {
    var frontIp = 'Could not get IP address. Try restarting.'
    var backIp = '';
}
else {
    var parts = addresses[0].split('.');
    var frontIp = `${parts[0]}.${parts[1]}.${parts[2]}.`
    var backIp = parts[3];
}
document.getElementById('frontIp').innerHTML = frontIp;
document.getElementById('backIp').innerHTML = backIp;

ipc.on('incompatible', () => {
    alert('The shortcut on your phone is incompatible with the current version of airwave. Please update both to the latest versions.')
})

function createHotspot() {
    ipc.send('hotspotOn', 'receive');
    document.getElementById('ip').style.display = 'none';
    wifiText.style.display = 'none';
    document.getElementById('qr').style.display = 'block';
    hotspotText.style.display = 'block'; 
    mode = 'hotspot';
}

function closeBtn()
{
    ipc.send('cleanupRcv', {});
}

function cancelBtn()
{
    ipc.send('cancelRcv', {});
    divInProgress.removeChild(divInProgress.childNodes[0]);
    btnCancel.style.display = "none";
    btnClose.style.display = 'inline-block';
    if (document.getElementsByClassName('received').length == 0) {
       document.getElementById('waiting').style.display = "block";
    }
}

var mode= 'wifi';
function minimizeBtn()
{
    ipc.send('minimize', {});
    var minimize = document.getElementById('btnMin');
    minimize.setAttribute("src", "../res/up.png")
    minimize.setAttribute("onclick", "maximizeBtn();")
    hotspotText.style.display = 'none';
    wifiText.style.display = 'none';
}

function maximizeBtn()
{
    ipc.send('maximize', {});
    var maximize = document.getElementById('btnMin');
    maximize.setAttribute("src", "../res/down.png")
    maximize.setAttribute("onclick", "minimizeBtn();")
    if (mode == 'wifi') {
        wifiText.style.display = 'block';
    }
    else {
        hotspotText.style.display = 'block';
    }
}

ipc.on('inProgress', (event, filedata) => {
    document.getElementById('waiting').style.display = "none";
    btnClose.style.display = "none";
    btnCancel.style.display = "inline-block";
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    divInProgress.innerHTML += `<div class="inProgress listItem text" id="inProgress" title='Receiving..'><div class="listImg"><img src="../res/spinner.gif" width="25" height="25"></div><div class="upText">${filedata[0]}</div><div class="downText">${hostname} - ${size}</div></div>`;
})

ipc.on('received', (event, filedata) => {
    btnClose.style.display = "inline-block";
    btnCancel.style.display = "none";
    if (divInProgress.childNodes.length == 0) {
        ipc.send('inProgress', filedata);
        return
    }
    else {
        divInProgress.removeChild(divInProgress.childNodes[0]);
    }
    var parts = filedata[3].split('\\');
    filePath = parts.join('\\\\');
    if (filedata[1] == null) {
        alert('Your iOS shortcut appears to be corrupted. Please download it again.');
        hostname = 'Corrupted';
    }
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    var divReceived = document.getElementById('divReceived')
    divReceived.innerHTML = `<div class="received listItem text" title='Open in Folder' onclick="openInFolder('${filePath}');"><div class="listImg"><img src="../res/file.png" width="25" height="25"></div><div class="upText">${filedata[0]}</div><div class="downText">${hostname} - ${size}</div></div>` + divReceived.innerHTML;
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