![Flashy banner, yo](banner.gif)

# twitchAFK
A SlimerJS script for idling a Twitch channel.

Its primary use is to earn Twitch drops, but it could have other uses as well.

## Setup
1. Download the repo.
2. Install [SlimerJS](https://slimerjs.org/download.html).
3. Download and run the [Firefox 59.0.3 installer](https://ftp.mozilla.org/pub/firefox/releases/59.0.3/) (not the most recent version of Firefox, it's unsupported by SlimerJS).
4. When installing, choose "Custom" and install to a non-default directory to avoid conflicts with the main release of Firefox. Uncheck "Install Maintenance Service".
5. Open Firefox 59.0.3, navigate to Options > General > Firefox Updates, and set it to "Never check for updates (not recommended)".

**A warning:** Never use Help > About Firefox. Mozilla takes this as a cue to ignore your user settings and shove the latest update down your throat.

6. [Configure SlimerJS's variables to point to your new Firefox installation.](https://docs.slimerjs.org/current/installation.html#configuring-slimerjs)
7. Configure the twitchAFKConfig.js file and ensure you've set your Twitch username and password correctly.

**A plea:** Please, please, *please* be contentious of other chat-goers and the streamer themselves when setting the ChatSpamRate options. Never set them below 2 minutes, and preferrably have them set higher than that. Nobody likes spam, and we're only really using it here to make it look like we're home. 

8. Run *slimerjs -CreateProfile [profile name]* to create a profile for the script to use. Ex: *slimerjs -CreateProfile twitchAFK*
9. The first time you run the script, you may need to fill out a CAPTCHA, complete two factor authentication, or verify your account via some other means. If this is the case (assuming you have furtherAuthDetection enabled), the console will note "further authentication required," and the script will give you time to complete that authentication. After that, as long as you're using a profile, twitchAFK should stay logged in and require no further user input.

## Command-line Syntax
The command to use the script is:

*slimerjs -P [profile name] twitchAFK.js \[Twitch channel]*

The Twitch channel argument is *optional*, and if not specified, the script will use the channel option from the configuration file.

You may or may not need to specify SlimerJS's location depending on how you've installed it. On Windows, to use it without specifying location, you'll need to add it to your PATH environmental variable.

For example:

*slimerjs -P twitchAFK twitchAFK.js rainbow6*

or

*slimerjs -P twitchAFK twitchAFK.js*

or

*"C:\Tools\SlimerJS\slimerjs.bat" -P twitchAFK twitchAFK.js rainbow6*

## Profiles

Using a profile for SlimerJS will allow it to store cookie and session information, meaning that it can remember your login. This allows for a slightly faster script startup, and will help to avoid problems with Twitch's CAPTCHAs, two factor authentication, or other impediments to logging in.

Run *slimerjs -CreateProfile [profile name]* to create a profile, and then append *-P [profile name]* to any slimerJS command to use that profile.

For example:

*slimerjs -P twitchAFK twitchAFK.js rainbow6*

Also, using multiple profiles can be used to switch between multiple Twitch accounts.

## You're ready to go!

Now you just need to set it up with a program for automatic scheduling.

For those of you on Windows, this'll probably end up being Task Scheduler, and I've included a PowerShell script within the Windows directory to stop the script so you can schedule an end point for it.

## Q&A

**Q:** I screwed up my configuration file. What do?

**A:** You can either redownload the default one from this repo, or more easily, you can delete your existing file and the script will recreate it with default values upon launch.

---

**Q:** Why doesn't this run headless? Why am I forced to have this damn thing up in the background?

**A:** Headless stacks like PhantomJS won't properly render the stream, thus causing problems. Sorry mate.

---

**Q:** I'm running into Captchas, please help?

**A:** Start using the profile system, you degenerate.

---

**Q:** Is refreshing the page, pausing and resuming the stream, or spamming the chat really neccessary to get drops?

**A:** No idea, since Twitch doesn't really make it clear. Regardless, I'm not taking any chances.

---

**Q:** Isn't this a bit unethical?

**A:** I don't know, man, I work during the day. If I could watch all the Rainbow 6 Pro League streams I would, but for now I'd like to still earn those charms. Besides, who's it harming?

---

**Q:** You suck, and this script sucks.

**A:** That's not a question.
