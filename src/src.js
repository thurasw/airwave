const ipc = require('electron').ipcRenderer;

document.getElementById('btnRcv').addEventListener('click', () =>
{
    ipc.send('receiveBtn', {})
})

document.getElementById('btnSend').addEventListener('click', () =>
{
    ipc.send('sendBtn', {})
})
