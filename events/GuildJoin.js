const {
    Events
} = require('discord.js');

module.exports = {
    name: Events.GuildCreate,
    async execute(client, guild) {
        console.log(`Joined guild ${guild.name} with ${guild.memberCount} members!`);
    }
}