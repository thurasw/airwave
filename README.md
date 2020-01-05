# airwave
Share Files between iOS and Windows without hassle.

Airwave is a simple electron app to transfer files between iOS and Windows. It is made as simple as I could. It uses node.js, electron, express and multer to handle all this.
[Feel free to donate. I won't cry about it.](https://paypal.me/thurasw)

Download the shortcuts:  


[Send - Over LAN](https://www.icloud.com/shortcuts/0a71151411274384977d6a636075cbd0)  
[Receive - Over LAN](https://www.icloud.com/shortcuts/7459e65af6854bdcac10ef7f79f7f25a)  
[Send - Using Hotspot](https://www.icloud.com/shortcuts/8cc6185536944118854a67e5eb833b42)  
[Receive - Using Hotspot](https://www.icloud.com/shortcuts/efa9ef4d9b1b4dc794f9763179fad6ee)  

# Before you use

1. Every time you update the SSID of Hotspot in settings, you must regenerate QR, restart the app and make appropriate changes in the shortcuts.

2. If you get a prompt to allow airwave through the firewall, make sure to select both public and private networks. (For some reason, Windows seems to consider the Hotspot created as a public network.)
If you don't get the prompt, you will have to go into Windows Firewall settings and allow airwave through both public and private networks.

3. iOS is pretty hesitant to connect to wifi networks without an internet connection so you might wanna go to Control Panel -> Network and Internet -> Network and Sharing Center -> Change adapter settings -> (Your actual Wifi Adapter **not hosted network**) -> Properties -> Sharing -> Allow other network users to connect through ...
This will share the internet from your main WiFi to the hotspot wifi and your phone will connect to the hotspot 2x 3x quicker. (This option is only available after you turn the hotspot on.)

3. This app is made using dark magic and you have to donate before you can use. I know. Very magical. [Here ;)](https://paypal.me/thurasw)

4. On a real note, it's very self-explanatory. Very user-friendly.

To-do:\
Show percentage of file being uploaded\
Authenticate user before accepting uploads\
Quit app  after Timeout?\
