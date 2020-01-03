const ipc = require('electron').ipcRenderer;

var ssid;
var password;
ipc.send('reqConfig', {});
ipc.on('config', function(event, reqConfig) {
  ssid = reqConfig[2];
  password = reqConfig[3];
  document.getElementById('hotspotText').innerHTML += `Name: "${ssid}"<br>Passkey: "${password}"`;
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
var parts = addresses[0].split('.');
var frontIp = `${parts[0]}.${parts[1]}.${parts[2]}.`
var backIp = parts[3];
document.getElementById('frontIp').innerHTML = frontIp;
document.getElementById('backIp').innerHTML = backIp;

function minimizeBtn()
{
    ipc.send('minimize', {});
    var minimize = document.getElementById('btnMin');
    minimize.setAttribute("src", "../res/up.png")
    minimize.setAttribute("onclick", "maximizeBtn();")
    document.getElementById('hotspotText').style.display = 'none';
}
function maximizeBtn()
{
    ipc.send('maximize', {});
    var maximize = document.getElementById('btnMin');
    maximize.setAttribute("src", "../res/down.png")
    maximize.setAttribute("onclick", "minimizeBtn();")
    document.getElementById('hotspotText').style.display = 'block';
}
function closeBtn() {
    ipc.send('cleanupSend', {});
}
ipc.on('startSending', function(event, message) {
    document.getElementById('waiting').style.display = "none";
    document.getElementById('btnClose').style.display = "none";
    document.getElementById('btnCancel').style.display = "inline-block";
    var filecount = message[0];
    var hostname = message[1];
    if (hostname == null) {
        alert('Your iOS shortcut appears to be corrupted. Please download it again.')
        hostname = 'Corrupted';
    }
    var sentId = hostname.replace(/\s+/g, '') + 'Text';
    var barId = hostname.replace(/\s+/g, '') + 'Bar';
    document.body.innerHTML += `<div class="inProgress text">${hostname}<span class="text progressText"><span id="${sentId}">0</span> out of ${filecount} files sent</span><div class="barBg"><div id="${barId}" class="progressBar"></div></div></div>`
});

ipc.on('sendUpdate', function(event, message) {
    document.getElementById('btnClose').style.display = "none";
    document.getElementById('btnCancel').style.display = "inline-block";
    var filecount = message[0];
    var hostname = message[1];
    if (hostname == null) {
        alert('Your iOS shortcut appears to be corrupted. Please download it again.');
        hostname = 'Corrupted';
    }
    var sentId = hostname.replace(/\s+/g, '') + 'Text';
    var barId = hostname.replace(/\s+/g, '') + 'Bar';
    var sentFiles = parseInt(document.getElementById(`${sentId}`).innerHTML) +1;
    document.getElementById(`${sentId}`).innerHTML = sentFiles;

    var percentage = (sentFiles/filecount)*100;
    document.getElementById(`${barId}`).style.width = `${percentage}%`;
    if (sentFiles == filecount) {
        document.getElementById('btnClose').style.display = "inline-block";
        document.getElementById('btnCancel').style.display = "none";
    }
})

function createHotspot() {
    ipc.send('hotspotOn', {});
    document.getElementById('ip').style.display = 'none';
    document.getElementById('wifiText').style.display = 'none';
    document.getElementById('qr').style.display = 'block';
    document.getElementById('hotspotText').style.display = 'block'; 
}