# twitchAFK
A SlimerJS script for idling a Twitch channel.

Its primary use is to earn Twitch drops, but it could have other uses as well.

## Setup
1. Download the repo.
2. Install [SlimerJS](https://slimerjs.org/download.html).
3. Download and run the [Firefox 59.0.3 installer](https://ftp.mozilla.org/pub/firefox/releases/59.0.3/) (not the most recent version of Firefox, it's unsupported by SlimerJS).
4. When installing, choose "Custom" and install to a non-default directory to avoid conflicts with the main release of Firefox. Uncheck "Install Maintenance Service".
5. Open Firefox 59.0.3, navigate to Options > General > Firefox Updates, and set it to "Never check for updates (not recommended)".

**A warning:** Never use Help > About Firefox. Mozilla takes this as a cue to ignore your user settings and shove the latest update down your throat. Not sure why, but it fills me with spite nevertheless.

6. [Configure SlimerJS's variables to point to your new Firefox installation.](https://docs.slimerjs.org/current/installation.html#configuring-slimerjs)
7. Configure the twitchAFKConfig.js file and ensure you've set your Twitch username and password correctly.

**A plea:** Please, please, *please* be contentious of other chat-goers and the streamer themselves when setting the ChatSpamRate options. Never set them below 2 minutes, and preferrably have them set higher than that. Nobody likes spam, and we're only really using it here to make it look like we're home. 

## Command-line Syntax
The command to use the script is:

slimerjs twitchAFK.js \[Twitch channel]

The Twitch channel argument is *optional*, and if not specified, the script will use the channel option from the configuration file.

You may or may not need to specify SlimerJS's location depending on how you've installed it. On Windows, to use it without specifying location, you'll need to add it to your PATH environmental variable.

For example:

slimerjs twitchAFK.js rainbow6

or

slimerjs twitchAFK.js

or

"C:\Tools\SlimerJS\slimerjs.bat" twitchAFK.js rainbow6

## You're ready to go!

Now you just need to set it up with a program for automatic scheduling.

For those of you on Windows, this'll probably end up being Task Scheduler, and I've included a PowerShell script within the Windows directory to stop the script so you can schedule an end point for the script.

## Q&A

**Q:** I screwed up my configuration file. What do?

**A:** You can either redownload the default one from this repo, or more easily, you can delete your existing file and the script will recreate it with default values upon launch.

---

**Q:** Why doesn't this run headless? Why am I forced to have this damn thing up in the background?

**A:** Headless stacks like PhantomJS won't properly render the stream, thus causing problems. Sorry mate.

---

**Q:** I'm running into Captchas, please help?

**A:** Stop running the script so often, you degenerate. Otherwise, you can uncomment the "Debug function for logging in manually" section in twitchAFK.js to give you 100 seconds to log in manually and solve the Captcha yourself.

---

**Q:** Isn't this a bit unethical?

**A:** I don't know, man, I work during the day. If I could watch all the Rainbow 6 Pro League streams I would, but for now I'd like to still earn those charms. Besides, who's it harming?

---

**Q:** You suck, and this script sucks.

**A:** That's not a question.
