# airwave
Share Files between iOS and Windows without hassle.

Right now, out of send and receive, only receive is working.

When you receive a file from your phone, if it's a big file, even if it's in progress, it won't show up in the ui until it's fully uploaded.

When you scan QR code, the shortcut will give you 5 secs before it switches back and continues. It will restart if it finds that you have not connected to the share wifi yet.

The shortcut can be run separately, in which case, you will be asked to pick from a file picker or it can be run from the share sheet from photos, pdfs and files too.

iOS is pretty hesitant to connect to wifi networks without an internet connection so you might wanna go to Control Panel -> Network and Internet -> Network and Sharing Center -> Change adapter settings -> (Your actual Wifi Adapter**not hosted network**) -> Properties -> Sharing -> Allow other network users to connect through ...
This will share the internet from your main WiFi to the hotspot wifi although it worked fine without internet sharing sometimes.

Last but not least, using netsh to start hotspot require admin privilleges and that's why you will get a prompt for that.
