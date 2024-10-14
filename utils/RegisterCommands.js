const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
var config = require('../config.json');
const path = require('path');
const chalk = require("chalk");

module.exports = (client) => {

    console.log(chalk.yellow.bold(`Started refreshing application (/) commands.`));

    // Just buckets for everything lol
    const commands = [];
    const devCommands = [];
    const commandNames = [];
    // loop through each command in the client.commands cache
    for (const [_, command] of client.commands) {
        // Attempt to parse the command data
        const commandData = command.data?.toJSON();
        commandData.dm_permission ??= false; // dms disabled by default
        try {
            if (!commandData) throw `No command.data found - Did you forget to save the file?`;
            // If the command is already registered, skip it
            if (commandNames.includes(commandData?.name)) continue;
            // Add the command name to the list so we can check for duplicates
            commandNames.push(commandData.name);
            // Add it to the respective bucket for processing
            if (command.dev) {
                devCommands.push(commandData);
            } else {
                commands.push(commandData);
            }
        } catch (error) {
            console.error(chalk.red.italic(`[REGISTER] Failed to register ${command.data.name}: ${error}`));
        }
    }

    // Error if you set a dev command but no guild ID
    // Nothing will break but it won't register the commands
    if (devCommands.length > 0 && !client.config.DEV_GUILD_ID) {
        console.warn(chalk.yellow.italic(`You have dev commands but no DEV_GUILD_ID in config.json - These will not be registered!`));
    }

    const rest = new REST({ version: '10' }).setToken(client.config.TOKEN);
    try {
        // public commands
        rest.put(
            Routes.applicationCommands(client.config.APP_ID),
            { body: commands },
        );

        // Only do this if there is a guild id set
        if (typeof client.config.DEV_GUILD_ID === 'string') {
            // dev commands
            rest.put(
                Routes.applicationGuildCommands(client.config.APP_ID, client.config.DEV_GUILD_ID),
                { body: devCommands },
            );
        }

        console.info(chalk.green.bold(`Successfully reloaded application (/) commands.`));
    } catch (error) {
        console.error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] ${error}`));
    }
}
