const {
    ActivityType
} = require('discord.js');
var config = require('../config.json');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.user.setActivity({
            name: `Developed by flomkk`,
            type: ActivityType.Listening,
            //   url: 'https://www.twitch.tv/discord'
        });
    },
};