const ipc = require('electron').ipcRenderer;

function closeBtn()
{
    ipc.send('cleanup', {});
}

function cancelBtn()
{
    ipc.send('cancel', {});
    document.getElementById('divInProgress').removeChild(document.getElementById('inProgress'));
    document.getElementById('btnCancel').style.display = "none";
    if (document.getElementsByClassName('received').length == 0) {
       document.getElementById('waiting').style.display = "block";
    }
}

function minimizeBtn()
{
    //WIP
}

function waitToProgress()
{
    document.getElementById('waiting').style.display = "none";
    //WIP//var close= document.getElementById('close');
    //WIP//close.setAttribute("src", "./src/down.png");
    //WIP//close.setAttribute("onclick", "minimizeBtn();");
}

ipc.on('inProgress', (event, filedata) => {
    waitToProgress ();
    document.getElementById('btnCancel').style.display = "inline";
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    document.getElementById('divInProgress').innerHTML += `<table title="Receiving.." id="inProgress" class="inProgress" ><tr><td><img class="fileImg" src="./src/spinner.gif" width="20" height="20"></td><td class='uptext'>${filedata[0]}</td></tr><tr><td></td><td class='downtext'>${hostname} - ${size}</td></tr></table>`;
})

ipc.on('received', (event, filedata) => {
    document.getElementById('btnCancel').style.display = "none";
    document.getElementById('divInProgress').removeChild(document.getElementById('inProgress'));
    var parts = filedata[3].split('\\');
    filePath = parts.join('\\\\');
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    document.getElementById('divReceived').innerHTML = `<table title="Open in Folder" class="received" onclick="openInFolder('${filePath}');"><tr><td><img class="fileImg" src="./src/file.png" width="25" height="25"></td><td class='uptext'>${filedata[0]}</td></tr><tr><td></td><td class='downtext'>${hostname} - ${size}</td></tr></table>` + document.getElementById('divReceived').innerHTML;
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