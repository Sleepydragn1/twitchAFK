// Flags
var firstOpen = true;
var refreshing = false;
var spamming = false;
var channelPoints = -1;

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
'exports.furtherAuthDetection = true; // Detect reCAPTCHAs, 2FA, or other authentication methods after login and pause for user input. true for enabled, false for disabled. \n' +
'exports.logging = true; // Exports console output to log files stored in the logs subfolder. true for enabled, false for disabled.\n\n' +
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
'/* Channel Points */\n' +
'exports.claimBonusPoints = true; // Claims bonus channel points when they pop up. true for enabled, false for disabled.\n' +
'exports.pointTracker = false; // Keeps track of channel points and outputs to the console when they increase. true for enabled, false for disabled.\n' +
'exports.pointTrackerRate = 5; // The rate at which channel points are checked and messages are sent out, in minutes\n\n' +
'/* Debug */\n' +
'exports.printSlimerErrors = true; // Output SlimerJS related error messages. true for enabled, false for disabled.\n' +
'exports.printSlimerErrorsStack = false; // Output SlimerJS stack traces as well. Requires printSlimerErrors to be enabled. true for enabled, false for disabled.\n' +
'exports.printJSConsole = false; // Output in-page console messages. true for enabled, false for disabled.\n' +
'exports.printJSErrors = false; // Output in-page JavaScript errors. true for enabled, false for disabled.\n' +
'exports.printJSErrorsStack = false; // Output stack traces as well. Requires printJSErrors to be enabled. true for enabled, false for disabled.\n' +
'exports.printJSErrorsStackVerbose = false; // If true, prints THE WHOLE STACK. If false, only prints the last line. Requires printJSErrors and printJSErrorsStack to be enabled.';

// Get default values
var defaultConfig = new Object();
Function(defaultConfigString.replace(/exports./g, "defaultConfig."))(); // Apparently Function runs faster than eval(), even if it doesn't look quite right...

var configPath = "twitchAFKConfig.js";
var configBuffer = {};
var channel;

// Process command line args
var system = require('system');
if (system.args.length > 1) { 
	for (let i = 1; i < system.args.length; i++) {
		if (system.args[i].toLowerCase() === '-u') {
			if (system.args.length > i + 1 && system.args[i + 1]) { 
				configBuffer["username"] = system.args[i + 1];
				i++;
			} else {
				console.log("-u argument missing follow-up argument!");
				console.log("Usage: slimerjs -P twitchAFK twitchAFK.js -u [username]");
			}
		} else if (system.args[i].toLowerCase() === '-p') {
			if (system.args.length > i + 1 && system.args[i + 1]) { 
				configBuffer["password"] = system.args[i + 1];
				i++;
			} else {
				console.log("-p argument missing follow-up argument!");
				console.log("Usage: slimerjs -P twitchAFK twitchAFK.js -p [password]");
			}
		} else if (system.args[i].toLowerCase() === '-c') {
			if (system.args.length > i + 1 && system.args[i + 1]) { 
				configPath = system.args[i + 1];
				i++;
			} else {
				console.log("-c argument missing follow-up argument!"); 
				console.log("Usage: slimerjs -P twitchAFK twitchAFK.js -c [config filename or path]");
			}
		} else if (system.args[i].toLowerCase() === '-k') {
			if (system.args.length > i + 2 && system.args[i + 1] && system.args[i + 2]) {
				if (defaultConfig.hasOwnProperty(system.args[i + 1])) {
					configBuffer[system.args[i + 1]] = system.args[i + 2];
					i+=2;
				} else {
					console.log("Key " + system.args[i + 1] + " doesn't exist in the config!");
				}
			} else {
				console.log("-k argument missing follow-up argument!");
				console.log("Usage: slimerjs -P twitchAFK twitchAFK.js -k [key] [value]");
			}
		} else if (i === system.args.length - 1) {
			channel = system.args[i];
		}
	}
}

// Get config
var config;
var fs = require('fs');
var loadDefaultConfig = function() {
	console.log("No config file found, creating a new one...");
	fs.write('twitchAFKConfig.js', defaultConfigString, 'w');

	config = require('twitchAFKConfig');
	console.log("Got the new, default config.");
}
if (fs.isReadable(configPath)) {
	config = require(configPath.replace(/\.[^/.]+$/, "")); // Stolen from: https://stackoverflow.com/a/4250408
	console.log("Got the config!");
} else if (configPath !== "twitchAFKConfig.js") {
	console.log("Custom config file not found, looking for the default config file...");
	if (fs.isReadable("twitchAFKConfig.js")) {
		config = require('twitchAFKConfig');
		console.log("Got the default config!");
	} else loadDefaultConfig();

} else loadDefaultConfig();

// Parse config changes from configBuffer
for (var key in configBuffer) {
	switch (typeof(defaultConfig[key])) {
		case "string":
			config[key] = configBuffer[key];
			break;
		case "number":
			let p = parseFloat(configBuffer[key]);
			if (p) config[key] = p;
			else console.log("Config key " + key + " requires a number. " + configBuffer[key] + " is not a valid number.");
			break;
		case "boolean":
			if (configBuffer[key].toLowerCase() === "true") config[key] = true;
			else if (configBuffer[key].toLowerCase() === "false") config[key] = false;
			else console.log("Config key " + key + " requires true or false. " + configBuffer[key] + " is neither.");
			break;
		case "object":
			try {
				let p = JSON.parse(configBuffer[key].replace(/'/g, '"'));
				if (typeof(p) === "string") config[key] = [p]; // For single elements without an array
				else config[key] = p;
			} catch (e) {
				console.log("Config key " + key + " requires an array formatted like this: ['LUL', 'TPFufun', 'VoteYea']");
				console.log(configBuffer[key] + " does not fit this pattern.")
			}
			break;
		default:
			console.log("Oh god, the defaultConfigString is broken. How did you do that?");
			console.log("If you didn't change anything yourself, contact the developer.");
			break;
	}
}

// Find any missing config values, add their default version to config
var defaultConfigKeys = Object.keys(defaultConfig);
var configKeys = Object.keys(config);
for (let i = 0; i < defaultConfigKeys.length; i++) {
	if (!configKeys.includes(defaultConfigKeys[i])) {
		console.log("The config value '" + defaultConfigKeys[i] + "' is missing, using default value of '" + defaultConfig[defaultConfigKeys[i]] + "' instead!");
		config[defaultConfigKeys[i]] = defaultConfig[defaultConfigKeys[i]];
	}
}

// Set channel if it hasn't been set by args
if (!channel) {
	channel = config.channel;
}

// Set up logging
if (!config.logging) {
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

// Handle and format top-level errors
// Called "script errors" by SlimerJS, but I'm calling them "SlimerJS errors" which I think is more understandable to users
phantom.onError = function(msg, stack) {
	if (config.printSlimerErrors) {
		console.log("[SlimerJS Error] " + msg);
		
		if (config.printSlimerErrorsStack && stack && stack.length) {
			stack.forEach(function(s) {
				// Modified from https://docs.slimerjs.org/current/api/phantom.html#onerror
				console.log("[SlimerJS Error] -> " + (s.file || s.sourceURL) + ": " + s.line + (s.function ? " (in function " + s.function + ")" : ""));
			});
		}
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
								// Check to make sure that channel points are active on the channel before enabling related features
								if (page.evaluate(function() {
									return $('.community-points-summary').is(':visible')
								}) && (config.chatSpamEnabled || config.claimBonusPoints)) {
									if (config.claimBonusPoints) bonusPoints();
									if (config.pointTracker) pointTracker();
								}
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

function bonusPoints() {
	if (!refreshing) {
		// This is honestly a pretty bad way to select the button, as it's not very resistant to layout changes.
		// I can't think of a better way, though, due to a lack of unique class or attribute names...
		if (page.evaluate(function() {
			var pointsButtons = $('.community-points-summary').find($('button'));
			if (pointsButtons.length > 1) {
				pointsButtons[1].click();
				return true;
			}
		})) {
			// Wait for a bit to avoid that point animation shebang
			window.setTimeout(function() {
				// Different layouts for point tracking enabled vs disabled 
				// Should make logs more searchable/readable
				if (!config.pointTracker) {
					console.log("Bonus points claimed! Channel points are up to " + currentPoints() + " now.");
				} else {
					console.log("Bonus points claimed!");
					console.log("Current channel points: " + currentPoints() + ".");
				}
			}, 3000);
		}

		// Set to check every 15 seconds. I think that seems reasonable?
		window.setTimeout(bonusPoints, 15000);
	} else {
		window.setTimeout(bonusPoints, 15000);
	}
}

function pointTracker() {
	if (!refreshing) {
		var curPoints = currentPoints();

		if (curPoints > channelPoints) {
			channelPoints = curPoints;
			console.log("Current channel points: " + curPoints + ".");
		}

		window.setTimeout(pointTracker, config.pointTrackerRate * 60000);
	} else {
		window.setTimeout(pointTracker, 15000);
	}
}

function currentPoints() {
	return page.evaluate(function() {
		// Get text from the tooltip, remove all the non-numbers, and then parse as an int
		return parseInt($('.community-points-summary').find($('[data-a-target="tw-tooltip-label"]')).first().text().replace(/[^0-9]/g, ''));
	});
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