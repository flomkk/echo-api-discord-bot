const fs = require('node:fs');
const { Events } = require('discord.js');
const ReadFolder = require('./ReadFolder.js');
var config = require('../config.json');
const chalk = require("chalk");

module.exports = function (client) {
	// Skip if the events folder was deleted
	if (!fs.existsSync(`${__dirname}/../events/`)) return;

	// This is a recursive function that will go through every folder and subfolder
	const files = ReadFolder('events');
	for (const { path, data } of files) {
		// This is more a sanity check than anything
		// It's just here to make sure everything loaded correctly
		if (typeof data.name !== 'string') {
			console.error(chalk.red.italic(`Could not load ${path} : Missing name`));
			continue;
		}

		// We try to map the names to internal DJS events
		// This helps prevent silly mistakes like typos
		if (Events[data.name]) data.name = Events[data.name];

		// If a mapping wasn't successful then it's likely a custom event or a typo
		// It will still work if you use client.emit() but it will never fire on it's own
		if (!Events[data.name] && !Object.values(Events).includes(data.name)) {
			console.error(chalk.red.italic(`Invalid event name "${data.name}" - Unknown to Discord.JS`));
		}

		// Again with the execute function lol
		if (typeof data.execute !== 'function') {
			console.error(chalk.red.italic(`Could not load ${path} : Missing an execute function`));
			continue;
		}

		// This will add it to client.on() or client.once() respectively
		// The function.bind() forces client to be the first argument no matter what
		// It helps to prevent function nesting, also just easier to read in my opinion lol
		// client.on('...', (...args) => data.execute(client, ...args));
		// client.on('...', data.execute.bind(null, client));
		client[data.once ? 'once' : 'on'](data.name, data.execute.bind(null, client));
	}

	console.log(chalk.yellow.bold(`Loaded ${files.length} events!`));
}
