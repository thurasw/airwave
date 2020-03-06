const ipc = require('electron').ipcRenderer;
const {remote, shell} = require('electron'),
dialog = remote.dialog;

var userSave = document.getElementById('currentSave');
var userLegacy = document.getElementById('legacy');
var userSsid = document.getElementById('ssid');
var userPassword = document.getElementById('password');
var userCheckForUpdate = document.getElementById('checkForUpdate');
var port = document.getElementById('port')

var config = [];
ipc.send('reqConfig', {});
ipc.on('config', function(event, reqConfig) {
    config = reqConfig;
    // Get the values from the config and show it as selected option
    userSave.innerHTML = 'Current Dir:  ' + config[0];
    if (config[1] == false) {
        userLegacy.selectedIndex = 1;
    }
    userSsid.setAttribute('value', config[2]);
    userPassword.setAttribute('value', config[3]);
    if (config[4] == false) {
        userCheckForUpdate.selectedIndex = 1;
    }
    port.setAttribute('value', reqConfig[5])
})

//When user chooses save location, open folder dialog and update text.
document.getElementById('saveDir').addEventListener('click', function(event) {
    dialog.showOpenDialog({
        title: "Choose a folder to save incoming files.",
        buttonLabel: "Select",
        properties: ['openDirectory'],
    }).then(result => {
        if(result.canceled) {
            return
        }
        else {
            config[0] = result.filePaths + '';
            userSave.innerHTML = 'Current Dir:  ' + config[0];
        }
    })
})

const saveBtn = document.getElementById('save');

var newConfig = [];
//When user presses save, save the settings into the config.
saveBtn.addEventListener('click', function(event) {
    event.preventDefault();
    newConfig.push(config[0]);
    if (userLegacy.selectedIndex == 1) {
        newConfig.push(false);
    }
    else {
        newConfig.push(true);
    }
    newConfig.push(userSsid.value);
    newConfig.push(userPassword.value);
    if (userCheckForUpdate.selectedIndex == 0) {
        newConfig.push(true);
    }
    else {
        newConfig.push(false);
    }
    if (port.value < 65535 && port.value > 1) {
        newConfig.push(parseInt(port.value));
        ipc.send('configSaved', newConfig);
    }
    else {
        alert('Please enter a valid port number between 1 and 65535');
        return
    }
})

function openSaveDir() {
    if (config[0] == 'Desktop') {
    }
    else {
        shell.openItem(config[0]);
    }
}