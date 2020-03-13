const ipc = require('electron').ipcRenderer;
btnClose = document.getElementById('btnClose');
var btnCancel = document.getElementById('btnCancel');
var header = document.getElementById('header')
header.style.backgroundColor = '#161616'

ipc.send('reqConfig', {});
ipc.on('config', function(event, reqConfig) {
  ssid = reqConfig[2];
  password = reqConfig[3];
  hotspotText.innerHTML += `Name: "${ssid}"<br>Passkey: "${password}"`;
})

if (window.innerHeight == 120) {
    hotspotText.style.display = 'none';
    wifiText.style.display = 'none';
}

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

var mode = 'wifi';
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
    maximize.setAttribute("src", "../res/down.png");
    maximize.setAttribute("onclick", "minimizeBtn();");
    if (mode == 'wifi') {
        wifiText.style.display = 'block';
    }
    else {
        hotspotText.style.display = 'block';
    }
}
function closeBtn() {
    ipc.send('cleanupSend', {});
}
ipc.on('startSending', function(event, message) {
    document.getElementById('waiting').style.display = "none";
    btnClose.style.display = "none";
    btnCancel.style.display = "inline-block";

    var filecount = message[0];
    var hostname = message[1];
    if (hostname == null) {
        alert('Your iOS shortcut appears to be corrupted. Please download it again.')
        hostname = 'Corrupted';
    }
    var sentId = hostname.replace(/\s+/g, '') + 'Text';
    var barId = hostname.replace(/\s+/g, '') + 'Bar';
    var percentId = hostname.replace(/\s+/g, '') + 'Percentage';
    document.body.innerHTML += `<div class="inProgress sendProgress text">${hostname}<span class="text progressText"><span id="${sentId}">0</span> out of ${filecount} files sent</span><div class="barBg"><div id="${barId}" class="progressBar"></div></div><span id="${percentId}" class='percentage'></span></div>`
});

ipc.on('sendUpdate', function(event, message) {
    document.getElementById('btnClose').style.display = "none"
    document.getElementById('btnCancel').style.display = "inline-block";
    var filecount = parseInt(message[0]);
    var hostname = message[1];
    if (hostname == null) {
        hostname = 'Corrupted';
    }
    var sentId = hostname.replace(/\s+/g, '') + 'Text';
    var barId = hostname.replace(/\s+/g, '') + 'Bar';
    var percentId = hostname.replace(/\s+/g, '') + 'Percentage';

    var sentFiles = parseInt(document.getElementById(`${sentId}`).innerHTML) +1;
    document.getElementById(`${sentId}`).innerHTML = sentFiles;
    
    var percentage = parseInt((sentFiles/filecount)*100) + '%';
    document.getElementById(`${percentId}`).innerHTML = percentage;
    document.getElementById(`${barId}`).style.width = percentage;
    if (sentFiles == filecount) {
        
        document.getElementById('btnClose').style.display = "inline-block"
        document.getElementById('btnCancel').style.display = "none";
    }
})

function createHotspot() {
    ipc.send('hotspotOn', 'send');
    document.getElementById('ip').style.display = 'none';
    wifiText.style.display = 'none';
    document.getElementById('qr').style.display = 'block';
    hotspotText.style.display = 'block'; 
    mode = 'hotspot';
}