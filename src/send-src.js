const ipc = require('electron').ipcRenderer;

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
function closeBtn() {
    ipc.send('cleanupSend', {});
}
ipc.on('startSending', function(event, message) {
    document.getElementById('waiting').style.display = "none";
    document.getElementById('btnClose').style.display = "none";
    document.getElementById('btnCancel').style.display = "inline-block";
    var filecount = message[0];
    var hostname = message[1];
    document.body.innerHTML += `<div class="inProgress text">${hostname}<span class="text progressText"><span id='${hostname}Text'>0</span> out of ${filecount} files sent</span><div class="barBg"><div id="${hostname}Bar" class="progressBar"></div></div></div>`
});

ipc.on('sendUpdate', function(event, message) {
    document.getElementById('btnClose').style.display = "none";
    document.getElementById('btnCancel').style.display = "inline-block";
    var filecount = message[0];
    var hostname = message[1];
    var sentFiles = parseInt(document.getElementById(`${hostname}Text`).innerHTML) +1;
    document.getElementById(`${hostname}Text`).innerHTML = sentFiles;

    var percentage = (sentFiles/filecount)*100;
    document.getElementById(`${hostname}Bar`).style.width = `${percentage}%`;
    if (sentFiles == filecount) {
        document.getElementById('btnClose').style.display = "inline-block";
        document.getElementById('btnCancel').style.display = "none";
        document.getElementById(`${hostname}Text`).innerHTML = `${filecount} files sent!`;
    }
})