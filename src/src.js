const ipc = require('electron').ipcRenderer;

document.getElementById('btnRcv').addEventListener('click', () =>
{
    ipc.send('receive-file', {})
})

document.getElementById('btnSend').addEventListener('click', () =>
{
    ipc.send('send-file', {})
})
