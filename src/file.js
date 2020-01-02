const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const {remote} = require('electron'),
dialog = remote.dialog;
win = remote.getCurrentWindow();

function minimizeBtn()
{
    ipc.send('minimize', {});
    var minimize = document.getElementById('btnMin');
    minimize.setAttribute("src", "../res/up.png")
    minimize.setAttribute("onclick", "maximizeBtn();")
    smallSend();
}

function maximizeBtn()
{
    ipc.send('maximize', {});
    var maximize = document.getElementById('btnMin');
    maximize.setAttribute("src", "../res/down.png")
    maximize.setAttribute("onclick", "minimizeBtn();")
}

function closeBtn() {
    ipc.send('cleanupSend', {});
}

function removeItem(name, path) {
    document.getElementById('fileList').removeChild(document.getElementById(name));
    names.splice( names.indexOf(name), 1 );
    paths.splice( paths.indexOf(path), 1 );
    console.log(document.getElementsByClassName('fileList').length);
    if (document.getElementsByClassName('fileList').length == 0) {
        document.getElementById('waiting').style.display = "block";
        document.getElementById('fileSend').style.display = "none";
        document.getElementById('removeText').style.display = "none";
    }
};

let names = [];
let paths = [];

let options = {
    title: "Choose files to upload",
    buttonLabel: "Send",
    properties: ['openFile','multiSelections']
}
function addFile() {
    document.getElementById('waiting').style.display = "none";
    document.getElementById('fileSend').style.display = "block";
    document.getElementById('removeText').style.display = "inline-block";
    if (document.getElementsByClassName('listItem').length > 4) {
        smallSend();
    }
}
function smallSend() {
    var fileSend = document.getElementById('fileSend')
    fileSend.id = 'smallSend';
    fileSend.innerHTML = 'Send';
}
function fileDialog() {
    dialog.showOpenDialog(win, options).then(result => {
        addFile();
        for (var i=0; i<result.filePaths.length; i++) {
            var parts = result.filePaths[i].split('\\');
            var filePath = parts.join('\\\\');
            var name = result.filePaths[i].replace(/^.*[\\\/]/, '');
            name = name.replace(/\s+/g, '');
            paths.push(result.filePaths[i]);
            names.push(name);
            document.getElementById('fileList').innerHTML = `<div id="${String(name)}" class="listItem text" title='Double Click to remove' ondblclick="removeItem('${name}', '${filePath}');"><div class="listImg"><img src="../res/file.png" width="25" height="25"></div><div class="upText">${name}</div><div class="downText">${getFileSize(result.filePaths[i])}</div></div>` + document.getElementById('fileList').innerHTML;
        }
      }).catch(err => {
        console.log(err)
      })
};

(function () {
    var holder = document.getElementById('drag-file');

    holder.ondragover = () => {
        document.getElementById('drag-file').style.backgroundColor = '#404040';
        return false;
    };

    holder.ondragenter = () => {
        return false;
    };

    holder.ondragleave = () => {
        document.getElementById('drag-file').style.backgroundColor = '#161616';
        return false;
    };

    holder.ondragend = () => {
        return false;
    };

    holder.ondrop = (e) => {
        e.preventDefault();
        document.getElementById('drag-file').style.backgroundColor = '#161616';
        addFile();
        for (let f of e.dataTransfer.files) {
            var name = String(f.name).replace(/\s+/g, '');
            names.push(name);
            paths.push(f.path);
            var parts = f.path.split('\\');
            var filePath = parts.join('\\\\');
            document.getElementById('fileList').innerHTML = `<div id="${String(name)}" class="listItem text" title='Double Click to remove' ondblclick="removeItem('${f.name}', '${filePath}');"><div class="listImg"><img src="../res/file.png" width="25" height="25"></div><div class="upText">${f.name}</div><div class="downText">${formatBytes(f.size)}</div></div>` + document.getElementById('fileList').innerHTML;
        }
        return false;
    };
})();

function fileSend() {
    ipc.send('fileSend', [names, paths]);
}

function getFileSize(filename) {
    var stats = fs.statSync(filename)
    var fileSize = stats["size"]
    return formatBytes(fileSize); 
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}