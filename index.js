const { Client, PermissionsBitField, GatewayIntentBits } = require('discord.js');
const path = require('path');
const chalk = require("chalk");

const client = new Client({
    intents: [
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessagePolls,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
});

client.config = require('./config.json');
client.cooldowns = new Map();
client.cache = new Map();

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);

console.log(chalk.yellow.bold(`Logging in...`));
client.login(client.config.TOKEN);
client.on('ready', function () {
    console.log(chalk.green.bold(`Logged in as ${client.user.tag}!`));

    require('./utils/CheckIntents.js')(client);
});

client.on('messageCreate', () => { })

async function InteractionHandler(interaction, type) {

    const component = client[type].get(interaction.customId ?? interaction.commandName);
    if (!component) {
        // console.error(`${type} not found: ${interaction.customId ?? interaction.commandName}`);
        return;
    }

    try {
        if (component.admin) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: `${client.config.EMOJIS.SHIELD} Only administrators can use this command`, ephemeral: true });
        }

        if (component.owner) {
            if (interaction.user.id !== client.config.OWNER) return await interaction.reply({ content: `${client.config.EMOJIS.SHIELD} Only bot owners can use this command`, ephemeral: true });
        }

        await component.execute(interaction, client);
    } catch (error) {
        console.error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] ${error}`));
        await interaction.deferReply({ ephemeral: true }).catch(() => { });
        await interaction.editReply({
            content: `${client.config.EMOJIS.ERROR} Something went wrong ..`,
            embeds: [],
            components: [],
            files: []
        }).catch(() => { });
    }
}

client.on('interactionCreate', async function (interaction) {
    if (!interaction.isCommand()) return;
    await InteractionHandler(interaction, 'commands');
});


client.on('interactionCreate', async function (interaction) {
    if (!interaction.isButton()) return;
    await InteractionHandler(interaction, 'buttons');
});


client.on('interactionCreate', async function (interaction) {
    if (!interaction.isStringSelectMenu()) return;
    await InteractionHandler(interaction, 'dropdowns');
});


client.on('interactionCreate', async function (interaction) {
    if (!interaction.isModalSubmit()) return;
    await InteractionHandler(interaction, 'modals');
});

const process = require('node:process');
process.on('unhandledRejection', async (reason, promise) => {
    console.log(chalk.red.italic('Unhandled rejection at:', promise, 'reason:', reason));
});

process.on('uncaughtException', (err) => {
    console.log(chalk.red.italic('Uncaught Exception:', err));
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log(chalk.red.italic('Uncaught Exception Monitor:', err, origin));
});