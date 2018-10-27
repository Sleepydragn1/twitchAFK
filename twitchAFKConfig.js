/* Config */
exports.channel = "sleepydragn1"; // Channel name to AFK at, UNLESS SPECIFIED VIA COMMAND LINE ARGUMENT

/* Refresh Rate */
exports.minRefreshRate = 30; // Minimum rate of how often the page should be refreshed in minutes
exports.maxRefreshRate = 45; // Maximum rate of how often the page should be refreshed in minutes

/* Pause Rate */
exports.minPauseRate = 3; // Minimum rate of how often to pause the stream in minutes
exports.maxPauseRate = 7; // Maximum rate of how often to pause the stream in minutes

/* Chat */
// Have some respect for your fellow chat members, please do not set the rate below 2 minutes.
exports.minChatSpamRate = 3; // Minimum rate of how often to spam chat with a randomized message in minutes
exports.maxChatSpamRate = 5;  // Maximum rate of how often to spam chat with a randomized message in minutes
exports.chatSpamEnabled = true; // To chat spam, or not to chat spam? true for enabled, false for disabled.
exports.chatSpams = [ // Array of randomized messages for chat spam - should be kept in quotes and seperated with a comma
	"LUL",
	"LUL LUL",
	"LUL LUL LUL",
	"TPFufun",
	"VoteYea",
	"VoteYea VoteYea",
	"VoteYea VoteYea VoteYea",
	"Kappa",
	"Kappa Kappa",
	"Kappa Kappa Kappa",
	"KonCha",
	"TehePelo"
];

/* Credentials */
exports.username = "AzureDiamond"; // Twitch username
exports.password = "hunter2"; // Twitch password