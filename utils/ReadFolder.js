const fs = require('node:fs');
var config = require('../config.json');
const chalk = require("chalk");

/* {
	path: string
	depth: number
	data: any
} */
const files = [];

// Entry point of the module
module.exports = function (path = '', depth = 3) {
	// clear the array of any previous data
	files.length = 0;
	// Start reading the folder
	ReadFolder(path, depth);
	return files;
}

// This is a recursive function that will read every folder and subfolder
function ReadFolder(path = '', depth = 3) {
	const folderFiles = fs.readdirSync(`${__dirname}/../${path}`, { withFileTypes: true });

	for (const file of folderFiles) {
		// Is the entry a file or a folder?
		if (file.isDirectory()) {
			// This is solely to prevent reference loops, maybe if a file references C:\Windows\System32 and then has to read 10,000s of files o_o
			if (depth === 0) return console.error(chalk.red.italic(`Maximum depth reached - Skipping ${file.name}`));
			// It's a folder so read it's contents too
			ReadFolder(`${path}/${file.name}`, depth - 1);
			continue;
		}

		// If it's not a JS file then skip it
		if (!file.name.endsWith('.js')) continue;

		try {
			// Load the file and add it to the array
			// The || just means if the require fails we return an empty object instead of null or undefined
			const data = require(`${__dirname}/../${path}/${file.name}`) || {};
			// And then add it to the array to be returned
			files.push({ path: `${path}/${file.name}`, depth, data });
		} catch (error) {
			// Safety first!
			// Will only fire if you have weird permissions on your file system lol
			console.error(chalk.red.italic(`Failed to load ./${path}/${file.name}: ${error.stack || error}`));
		}
	}
}