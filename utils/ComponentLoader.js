const ReadFolder = require('./ReadFolder.js');
const { existsSync } = require('node:fs');
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');
var config = require('../config.json');
const chalk = require("chalk");

// List of all the folders we want to load from
const modules = [
	'commands',
	'buttons',
	'dropdowns',
	'modals',
	'contextmenus',
];

// This code gets ran for every command, button, dropdown, and modal
// It's only purpose is to load the cache and make sure you didn't try to do something dumb
// This is often where you will see errors like "No execute function found"
module.exports = function (client) {
	console.clear();
	for (const module of modules) {
		client[module] = new Map();

		// We ignore the folder if it doesn't exist, ie no buttons folder
		if (!existsSync(`${__dirname}/../${module}`)) continue;

		// Fetch every file in the folder
		// This is a recursive function that will go through every folder and subfolder
		const files = ReadFolder(module);
		for (const { path, data } of files) {
			try {
				// Basic checking, every file must have an execute function
				if (!data.execute) throw `No execute function found`;
				if (typeof data.execute !== 'function') throw `Execute is not a function`;

				if (module === 'commands') {
					// If it is a command we check it has a data property
					if (!(data.data instanceof SlashCommandBuilder)) throw 'Invalid command - Must use the Slash Command Builder';
					// And then add it to the cache by name
					client[module].set(data.data.name, data);
				} else {
					// Anything else uses customIDs
					if (!data.customID) throw 'No custom ID has been set';
					if (typeof data.customID !== 'string') throw 'Invalid custom ID - Must be string';
					// And then add it to the cache by customID
					client[module].set(data.customID, data);
				}
			} catch (error) {
				// These are the errors you will see :D
				console.error(chalk.red.italic(`[${module.toUpperCase()}] Failed to load ./${path}: ${error.stack || error}`));
			}
		}
		console.log(chalk.yellow.bold(`Loaded ${client[module].size} ${module}`))
	}
};