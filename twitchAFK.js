// Flags
var firstOpen = true;
var refreshing = false;
var spamming = false;

// Archive console.log calls for later logging, if enabled
// We can't do this later since we need to get the config first to determine if we even want to log these to a file
var baseLog = console.log;
var archivedMsgs = "";
console.log = function(msg) {
	var logMsg = logFormat(msg);
	
	baseLog(logMsg);
	archivedMsgs += logMsg + "\n";
}

// Default config, no touch pls, use twitchAFKConfig.js instead
var defaultConfigString = '/* Config */\n' +
'exports.channel = "sleepydragn1"; // Channel name to AFK at, UNLESS SPECIFIED VIA COMMAND LINE ARGUMENT\n' +
'exports.furtherAuthDetection = true; // Detect reCAPTCHAs, 2FA, or other authentication methods after login and pause for user input\n' +
'exports.loggingEnabled = true; // If true, exports console output to log files stored in the logs subfolder\n\n' +
'/* Video Quality */\n' +
'exports.maxQuality = "MIN"; // Maximum video quality setting to use\n' +
'// Possible Values:\n' +
'// "MAX" or "SOURCE"\n' +
'// "AUTO"\n' +
'// "1080p60"\n' +
'// "1080p"\n' +
'// "720p60"\n' +
'// "720p"\n' +
'// "480p"\n' +
'// "360p"\n' +
'// "160p"\n' +
'// "MIN"\n\n' +
'/* Application Resolution */\n' +
'exports.width = 1280; // Width of the application window. Does not affect the stream resolution.\n' +
'exports.height = 720; // Height of the application window. Does not affect the stream resolution.\n\n' +
'/* Refresh Rate */\n' +
'exports.minRefreshRate = 30; // Minimum rate of how often the page should be refreshed in minutes\n' +
'exports.maxRefreshRate = 45; // Maximum rate of how often the page should be refreshed in minutes\n\n' +
'/* Pause Rate */\n' +
'exports.minPauseRate = 3; // Minimum rate of how often to pause the stream in minutes\n' +
'exports.maxPauseRate = 7; // Maximum rate of how often to pause the stream in minutes\n\n' +
'/* Chat */\n' +
'// Have some respect for your fellow chat members, please do not set the rate below 2 minutes.\n' +
'exports.chatSpamEnabled = true; // To chat spam, or not to chat spam? true for enabled, false for disabled.\n' +
'exports.minChatSpamRate = 3; // Minimum rate of how often to spam chat with a randomized message in minutes\n' +
'exports.maxChatSpamRate = 5;  // Maximum rate of how often to spam chat with a randomized message in minutes\n' +
'exports.chatSpams = [ // Array of randomized messages for chat spam - should be kept in quotes and seperated with a comma\n' +
'	"LUL",\n' +
'	"LUL LUL",\n' +
'	"LUL LUL LUL",\n' +
'	"TPFufun",\n' +
'	"VoteYea",\n' +
'	"VoteYea VoteYea",\n' +
'	"VoteYea VoteYea VoteYea",\n' +
'	"Kappa",\n' +
'	"Kappa Kappa",\n' +
'	"Kappa Kappa Kappa",\n' +
'	"KonCha",\n' +
'	"TehePelo"\n' +
'];\n\n' +
'/* Credentials */\n' +
'exports.username = "AzureDiamond"; // Twitch username\n' +
'exports.password = "hunter2"; // Twitch password\n\n' +
'/* Debug */\n' +
'exports.printJSConsole = false; // Output in-page console messages if true\n' +
'exports.printJSErrors = false; // Output in-page JavaScript errors if true\n' +
'exports.printJSErrorsStack = false; // Output stack traces as well if true. Requires printJSErrors to be enabled.\n' +
'exports.printJSErrorsStackVerbose = false; // If true, prints THE WHOLE STACK. If false, only print the last line. Requires printJSErrors and printJSErrorsStack to be enabled.';

// Get default values
var defaultConfig = new Object();
Function(defaultConfigString.replace(/exports./g, "defaultConfig."))(); // Apparently Function runs faster than eval(), even if it doesn't look quite right...

// Get config
var config;
var fs = require('fs');	
if (fs.isReadable('twitchAFKConfig.js')) {
	config = require('twitchAFKConfig');
	console.log("Got the config!");
} else {
	console.log("No configuration file found, creating a new one...");
	fs.write('twitchAFKConfig.js', defaultConfigString, 'w');
	
	config = require('twitchAFKConfig');
	console.log("Got the new, default config.");
}

// Find any missing config values, add their default version to config
var defaultConfigKeys = Object.keys(defaultConfig);
var configKeys = Object.keys(config);
for (var i = 0; i < defaultConfigKeys.length; i++) {
	if (!configKeys.includes(defaultConfigKeys[i])) {
		console.log("The config value '" + defaultConfigKeys[i] + "' is missing, using default value of '" + defaultConfig[defaultConfigKeys[i]] + "' instead!");
		config[defaultConfigKeys[i]] = defaultConfig[defaultConfigKeys[i]];
	}
}

var channel = config.channel;

// Get channel name from args if possible
var system = require('system');
if (system.args[1]) channel = system.args[1];

// Set up logging
if (!config.loggingEnabled) {
	// Go back to the default console.log behavior
	console.log = function(msg) {
		baseLog(logFormat(msg));
	};
} else {
	try {
		if (!fs.isDirectory('logs')) {
			fs.makeDirectory('logs');
		}
		
		// Setup filename for log file
		var startDate = new Date();
		// Ex. sleepydragn1_2020.04.05_07.46
		// What a mess...
		var logFilename = channel + "_" + startDate.getFullYear() + "." + (startDate.getMonth() + 1).toString().padStart(2, "0") + "." + startDate.getDate().toString().padStart(2, "0") + "_" + startDate.getHours().toString().padStart(2, "0") + "." + startDate.getMinutes().toString().padStart(2, "0");
		
		// Backup behavior for edge case where log filename already exists
		if (fs.exists('logs/' + logFilename + ".txt")) {
			logFilename += "-" + 1;
			if (fs.exists('logs/' + logFilename + ".txt")) {
				// Keep adding +1 to the number at the end of the filename until it works
				var i = 2;
				while (fs.exists('logs/' + logFilename + ".txt")) {
					logFilename = logFilename.slice(0, -1 * (i.toString().length + 1));
					logFilename += "-" + i;
					i++;
				}
			}
		}
		
		// Open the file as a stream for later writing
		// SlimerJS lacks documentation for this feature, so go off of PhantomJS' docs for this
		// ... but even their documentation isn't really complete.
		var logFile = fs.open('logs/' + logFilename + ".txt", 'w');
		
		// Log those messages we archived at the beginning
		logFile.write(archivedMsgs);
		logFile.flush();
		
		console.log = function(msg) {
			var logMsg = logFormat(msg);
			baseLog(logMsg);
			try {
				logFile.writeLine(logMsg);
				logFile.flush();
			} catch (e) {
				console.log = function(msg) {
					baseLog(logFormat(msg));
				};
				
				console.log("Something went wrong with the logging files, probably related to file permissions.");
				console.log("Disabling logging...");
			}
		}
	} catch (e) {
		console.log = function(msg) {
			baseLog(logFormat(msg));
		};

		console.log("Something went wrong with the logging files, probably related to file permissions.");
		console.log("Disabling logging...");
	}
}

// Convert channel name into proper Twitch URL
var streamURL = "https://twitch.tv/" + channel;

var page = require("webpage").create();

// Change user-agent to mask SlimerJS
page.settings.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0";

// Set application resolution
page.viewportSize = {
    width: config.width,
    height: config.height
};

// Handle in-page console messages
if (config.printJSConsole) {
	page.onConsoleMessage = function(msg) {
		//system.stderr.writeLine('Console: ' + msg);
		console.log('[In-page Console] ' + msg);
	};
}

// Handle in-page JavaScript errors
if (config.printJSErrors) {
	page.onError = function(msg, stack) {
		var errorMsg = "In-page JavaScript error occured:\n" + msg;
		if (config.printJSErrorsStack && stack.length) {
			errorMsg += "\n	Stack:";

			var stackPrint = function(s) {
				// Shamelessly stolen from: http://phantomjs.org/api/webpage/handler/on-error.html
				var stackMsg = "-> " + s.file + ": " + s.line;
				if (s.function) {
					stackMsg += " (in function '" + s.function + "')";
				}

				// Split long (80+ character) stacks into multiple lines.
				// Otherwise it becomes impossible to read.
				var lines = Math.ceil(stackMsg.length / 80);

				if (lines > 1) {
					var stackMsgTabbed = "";

					for (var i = 0; i < lines - 1; i++) {
						stackMsgTabbed += "\n		" + stackMsg.slice(80 * i, 81 + (80 * i));
					}
					stackMsgTabbed += "\n		" + stackMsg.slice(80 * (lines - 1));

					errorMsg += stackMsgTabbed;
				} else {
					errorMsg += "\n		" + stackMsg;
				}
			}

			// If verbose, print the entire stack.
			// If not, print only the last line.
			if (!config.printJSErrorsStackVerbose) {
				stackPrint(stack[stack.length - 1]);
			} else {
				stack.forEach(function(s) {
					stackPrint(s);
				});
			}
		}
		console.log(errorMsg);
	};
}

// Debug function for logging in manually
/*page.open("https://www.twitch.tv", function(status) { });
window.setTimeout(function() {
	openStream();
}, 100000);*/

twitchLogin(openStream);

function twitchLogin(callback) {
    page.open("https://www.twitch.tv", function(status) {
        if (status == "success") {
			mutePage();
			
			// Is the user already logged in via slimer's profile system? If so, skip past the login.
			if (page.cookies.filter(cookie => cookie.name.includes("login")).length) {
				console.log("You're already logged in to Twitch. Good on you.");
				
				callback();
			} else {
				console.log("Logging into Twitch...");
				
				// Inject jQuery for maximum crutch
				// Undocumented behavior: injectJs returns true if it's successful, like the original phantomJs specification
				if (page.injectJs('jquery-3.3.1.min.js')) {
					page.evaluate(function() {
						$("[data-a-target='login-button']")[0].click();
					});
					window.setTimeout(function() {
						waitFor(function() {
							return page.evaluate(function() {
								return $('[autocomplete=username]').is(':visible');
							});
						}, function() {
							if (page.evaluate(function() {
								$('[autocomplete=username]').click();
								$('[autocomplete=username]').focus();
								return true;
							})) {
								page.sendEvent('keypress', config.username);
							}
							
							if (page.evaluate(function() {
								$('[autocomplete=current-password]').click();
								$('[autocomplete=current-password]').focus();
								return true;
							})) {
								page.sendEvent('keypress', config.password);
								page.evaluate(function() {
									$('[data-a-target=passport-login-button]').click();
								});
								
								// Wait for Twitch to finish logging in...
								var finalizeLogin = function(loginTimeout = 60000) {
									waitFor(function() {
										return page.cookies.filter(cookie => cookie.name.includes("login")).length;
									}, function() {
										// Give it a little extra time, just in case the cookie isn't quite in line with the login
										window.setTimeout(function() {
											console.log("Logged into Twitch!");
											callback();
										}, 1000);
									}, loginTimeout);
								};
								
								waitFor(function() {
									/* 	If furtherAuthDetection is enabled, we check for the login window to remain visible
										If not, just check for the login cookie like normal
										I honestly can't think of an edge case where you wouldn't want it enabled, but who knows? */
									if (config.furtherAuthDetection) {
										return page.evaluate(function() {
											return !$('[data-a-target="passport-modal"]').is(':visible');
										});
									} else {
										return true;
									}
								}, finalizeLogin, 30000, function () {
									console.log("Further authentication required. Waiting 10 minutes for user input...");
									finalizeLogin(600000);
								});
								
							}
						}, 15000);
					}, 5000);
				}
			}
        } else {
            console.log("Shit, the Twitch homepage failed to load, retrying in 15s...");
            window.setTimeout(twitchLogin, 15000);
        }
    });
}

function openStream() {
    refreshing = true;
    
    page.open(streamURL, function(status) {
		if (status == "success") {
			console.log("Stream opened.");
			
			page.switchToMainFrame();
			
			// Inject jQuery for maximum crutch
			if (page.injectJs('jquery-3.3.1.min.js')) {
				if (firstOpen) {
					// Give the mature warning a little time to load...
					window.setTimeout(function() {
						if (page.evaluate(function() {
							if ($('[data-a-target="player-overlay-mature-accept"]').is(':visible')) {
								$('[data-a-target="player-overlay-mature-accept"]').click();
							}
							return true;
						})) {
							waitFor(function() {
								return page.evaluate(function() {
									return $('[data-a-target="player-mute-unmute-button"]').is(':visible');
								});
							}, function() {
								page.evaluate(function() {
									// Check if stream is unmuted, mute if it is
									if ($('[data-a-target="player-mute-unmute-button"]').attr('aria-label').includes("Mute")) {
										$('[data-a-target="player-mute-unmute-button"]').click();
									}
									// Switch to theatre mode
									$('[data-a-target="player-theatre-mode-button"]').click();
								});
								
								// Check for chat rules, accept them if they exist.
								// Executed after quality setting, to avoid interfering with it.
								var acceptChatRules = function() {
									page.evaluate(function() {
										var chatInput = $('[data-a-target="chat-input"]');

										chatInput.focus();
										chatInput.click();
										
										window.setTimeout(function() {
											if ($('[data-test-selector="chat-rules-ok-button"]').is(':visible')) {
												$('[data-test-selector="chat-rules-ok-button"]').click();
											}
										}, 1000);
									});
								};
								
								// Check first to see if the quality options exist...
								if (page.evaluate(function() {
									$('[data-a-target="player-settings-button"]').click();
									return $('[data-a-target="player-settings-menu-item-quality"]').is(':visible');
								})) {
									if (page.evaluate(function(quality) {
										// Open up the quality options
										$('[data-a-target="player-settings-menu-item-quality"]').click();
										
										var qualityButtons = $('.tw-radio[data-a-target="player-settings-submenu-quality-option"]').children('input');
										
										// I think this helps to keep the quality options box open.
										// Who knows?
										qualityButtons[0].focus();
										
										if (quality.includes("MAX") || quality.includes("SOURCE")) {
											qualityButtons[1].click();
										} else if (quality.includes("MIN")) {
											qualityButtons[qualityButtons.length - 1].click();
										} else if (quality.includes("AUTO")) { 
											qualityButtons[0].click();
										} else {			
											// Get all of the available qualities, in string form
											var qualities = [];
											for (var i = 0; i < qualityButtons.length; i++) {
												qualities.push($('.tw-radio[data-a-target="player-settings-submenu-quality-option"]').children('label').children('div')[i].textContent.toUpperCase());
											}

											// Look for matching qualities for maxQuality
											var qualityMatches = [];
											for (var k = 0; k < qualities.length; k++) {
												if (qualities[k].includes(quality)) qualityMatches.push(k);
											}

											if (qualityMatches.length > 1) {
												// If we have more than one match (probably [quality] (Source) and [quality]), choose the second
												qualityButtons[qualityMatches[1]].click();
											} else if (qualityMatches.length === 1) {
												// If we have a single match, that's the one we want
												qualityButtons[qualityMatches[0]].click();
											} else {
												// If we have no matches, the quality isn't avaiable, and we only have LOWER qualities to choose from
												// Let's choose the highest quality that isn't Auto
												qualityButtons[1].click();
											}
										}
										
										return true;
									}, config.maxQuality.toUpperCase())) {
										acceptChatRules();
									}
								} else {
									console.log("No quality options found. Perhaps the stream is offline?");
									acceptChatRules();
								}
								
								refreshing = false;
								firstOpen = false;

								pausePlay();
								if (config.chatSpamEnabled) chatSpam();
								refresh();
							}, 15000);
						}
					}, 3500)
				} else {
					page.evaluate(function() {
						$('[data-a-target="player-theatre-mode-button"]').click();
					});

					refreshing = false;

					console.log("Stream refreshed!");
				}
			}
		} else {
			console.log("Shit, the stream failed to load, retrying in 15s...");
            window.setTimeout(openStream, 15000);
		}
    });
}

function pausePlay() {   
    if (!refreshing && !spamming) {
        window.setTimeout(function() {
            console.log("Pausing stream!");
            
            if (page.evaluate(function() {
				$('[data-a-target="player-play-pause-button"]').click();
				return true;
            })) {
				window.setTimeout(function() {
                    if (page.evaluate(function() {
						$('[data-a-target="player-play-pause-button"]').click();
						return true;
					})) {
						console.log("Resuming stream.");
					}
                }, Math.floor(5000 + (Math.random() * 12000)));
			}
            pausePlay();
        }, randomRate(config.minPauseRate, config.maxPauseRate));
    } else {
        console.log("Tried to pause during a refresh or spam, waiting 15s...");
        window.setTimeout(pausePlay, 15000);
    }
}

function chatSpam() {
    if (!refreshing) {	
		var rate;
		
		if (config.minChatSpamRate < 2 || config.maxChatSpamRate < 2) {
			rate = randomRate(2, 5);
		} else {
			rate = randomRate(config.minChatSpamRate, config.maxChatSpamRate);
		}
		
		window.setTimeout(function() {
			// Check if the chat is disabled, most likely due to subscribers-only mode
			if (page.evaluate(function() {
				return !$('[data-a-target="chat-send-button"]').is(":disabled");
			})) {
				spamming = true;
			
				var spam = config.chatSpams[Math.floor(Math.random() * config.chatSpams.length)];
				
				console.log("Chat spamming '" + spam + "'!");

				if (page.evaluate(function() {
					var chatInput = $('[data-a-target="chat-input"]');

					chatInput.focus();
					chatInput.click();
					
					return true;
				})) {
					// Put randomized delay between the keystrokes to mask automation
					var i = 0;
					var key = spam[0];
					var pressRate = randomRate(0.00075, 0.00166667);
					var press = function() {
						window.setTimeout(function() {
							page.sendEvent('keypress', key);
							
							i++;
							key = spam[i];
							pressRate = randomRate(0.00075, 0.00166667);
							if (i < spam.length) {
								press();
							} else {
								// Send it.
								if (page.evaluate(function() {
									// Find dat chat send button
									$('[data-a-target=chat-send-button]').focus();
									return true;
								})) {
									// event.key.Enter doesn't seem to work at all. Very frustrating.
									// event.key.Return creates a newline when focused on the chat input, for some reason, so we need to use the send button
									page.sendEvent('keypress', page.event.key.Return);
								}
							}
						}, pressRate);
					};
					
					press();
				}
				
				spamming = false;
			} else {
				console.log("Chat appears to be disabled, aborting a chat spam.");
			}
			
			chatSpam();
        }, rate);
    } else {
        console.log("Tried to spam during a refresh, waiting 15s...");
        window.setTimeout(chatSpam, 15000);
    }
}
    
function refresh() {
	if (!spamming) {
		window.setTimeout(function() {
			console.log("Refreshing stream!");
			
			openStream();
			refresh();
		}, randomRate(config.minRefreshRate, config.maxRefreshRate));
	} else {
		console.log("Tried to refresh during a spam, waiting 15s...");
        window.setTimeout(refresh, 15000);
	}
}

// Stolen (and then modified) from https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js
function waitFor(testFx, onReady, timeOutMillis, onTimeout = function() {
	console.log("Critical timeout, twitchAFK is exiting.");
	phantom.exit(1);
}) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 44445, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
			if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
				// If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
					clearInterval(interval);
					onTimeout();
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    //console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

// Mute any video on the page.
function mutePage() {
	page.evaluate(function() {
		document.querySelectorAll('video').forEach(video => video.muted = true);
	});
}

// Used for debug purposes
function screenshot() {
    page.render('currentscreen.png');  
}

function randomRate(min, max) {
    return Math.floor((min + ((max - min) * Math.random())) * 60000);
}

function logFormat(msg) {
	var curDate = new Date();
	// Ex: [Apr 05 2020 7:29:46 PM] Got the config!
	return "[" + curDate.toDateString().slice(4) + " " + curDate.toLocaleTimeString() + "] " + msg;
}