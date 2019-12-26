# airwave
Share Files between iOS and Windows without hassle.


Airwave is a simple electron app to transfer files between iOS and Windows. It is made as simple as I could. It uses node.js, electron, express and multer to handle all this.
[Feel free to donate. I won't cry about it.](https://paypal.me/thurasw)

# Before you use
The app comes default using Window 10's Mobile Hotspot. As of moment, the program can't change the SSID and password of Mobile Hotspot so you will have to change it yourself. You can still open the config and update the WiFi details to regenerate the QR for the scan.

If the shorcut says "You're offline" or anything similar, chances are your phone isn't connected to the Wifi yet. Give it some more time.

The shortcut can be run separately, in which case, you will be asked to pick from a file picker or it can be run from the share sheet from photos, pdfs and files too.

There's two different modes the normal mode and the legacy mode.

Legacy Mode has some problems.

1.It can't be used on many newer devices.

2. iOS is pretty hesitant to connect to wifi networks without an internet connection so you might wanna go to Control Panel -> Network and Internet -> Network and Sharing Center -> Change adapter settings -> (Your actual Wifi Adapter **not hosted network**) -> Properties -> Sharing -> Allow other network users to connect through ...
This will share the internet from your main WiFi to the hotspot wifi although it worked fine without internet sharing sometimes.

**BUT YOU NEED TO BE CONNECTED TO A WIFI TO USE NORMAL MODE** so legacy mode might come in handy as well.

To-do:\
Show percentage of file being uploaded\
Authenticate user before accepting uploads\
Sending\
Auto-update SSID and password of Mobile Hotspot\
option to minimize the UI while sending or receiving\
Add Local Mode (Use your home WiFi and send files through router). Still technically doable now but have plans to make it easier.\
