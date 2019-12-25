const ipc = require('electron').ipcRenderer;

function closeBtn()
{
    ipc.send('cleanup', {})
}

function minimizeBtn()
{
    //WIP
}

function waitToProgress()
{
    var waiting = document.getElementsByClassName("waiting");
    var i;
    for (i = 0; i < waiting.length; i++) {
        waiting[i].style.display = "none";
    }
    //WIP//var close= document.getElementById('close');
    //WIP//close.setAttribute("src", "./src/down.png");
    //WIP//close.setAttribute("onclick", "minimizeBtn();");
}

ipc.on('inProgress', (event, filedata) => {
    waitToProgress ();
    var parts = filedata[3].split('\\');
    filePath = parts.join('\\\\');
    var hostname = "from ".concat(filedata[1]);
    var size = formatBytes(filedata[2]);
    document.body.innerHTML += `<table title="Open in Folder" class="receiving" onclick="openInFolder('${filePath}');"><tr><td><img class="fileImg" src="./src/file.png" width="25" height="25"></td><td class='uptext'>${filedata[0]}</td></tr><tr><td></td><td class='downtext'>${hostname} - ${size}</td></tr></table>`;
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