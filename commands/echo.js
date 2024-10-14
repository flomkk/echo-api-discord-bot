/* 
	DEVELOPED BY: flomkk (Discord-ID: 129383676650848257)

	WAY TO ADD THE TRACES TO THE EMBED ISNT
	FIXXED YET. NEED HANDLING FOR MORE THAN 
	1024 CHARS IN THE RESPONSE DATA.

	.addFields([
		{ name: `> Traces`, value: `${data.results.traces.join('\n')}`, inline: false },
	])

	const resultsEmbed2 = new EmbedBuilder()
		.setTitle(`> Traces`)
		.setDescription(data.results.traces.map(trace => {
			return `${trace.name || 'N/A'}, - ${trace.in_instance || 'N/A'}`;
		}).join('\n') || 'No traces available')
*/

const {
	PermissionsBitField,
	SlashCommandBuilder,
	EmbedBuilder
} = require('discord.js');
const path = require('path');
const chalk = require("chalk");
var config = require('../config.json');

module.exports = {
	// owner: true/false,
	// admin: true/false,
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Send an echo link to a user')
		.addSubcommand(subcommand =>
			subcommand.setName('send')
				.setDescription('Choose a user that will get the echo link via dm')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('Choose a user that will get the echo link via dm')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('check')
				.setDescription('Check the scan results of the provided scan id')
				.addStringOption(option =>
					option.setName('scan_id')
						.setDescription('The scan id you want to check')
						.setRequired(true)))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages),

	async execute(interaction, client) {
		const { options } = interaction;
		const subcommand = options.getSubcommand();

		await interaction.deferReply({ ephemeral: true });

		if (!subcommand) {
			return await interaction.editReply({ content: `${config.EMOJIS.ERROR} Invalid subcommand provided.`, ephemeral: true });
		}

		if (subcommand === 'send') {
			const targetUser = options.getUser('user');

			if (interaction.member.roles.cache.get(config.SETUP.ALLOWED_ROLE_ID) || 
			Object.values(config.DEVELOPER).includes(interaction.user.id) ||
			interaction.user.id === config.OWNER
		) {
				try {
					const response = await fetch(`${config.SETUP.ECHO_API.ENDPOINTS.PIN_WITHOUT_IP}`, {
						method: 'GET',
						headers: {
							'Authorization': config.SETUP.ECHO_API.ECHO_API_KEY,
							'Content-Type': 'application/json',
						},
					});

					if (!response.ok) {
						throw new Error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] Failed to fetch: ${response.statusText}`));
					}

					const data = await response.json();
					const pin = data.pin;
					const links = data.links;
					const link = links.fivem;

					const UserEmbed = new EmbedBuilder()
						.setTitle(`${interaction.guild.name} - Analysis`)
						.setDescription(
							`Hello ${targetUser}, you are part of a analysis.\nPlease follow the instructions and do not leave the game if you're currently playing. If there are any issues with your scan, please contact an analyst.\n\n`
						)
						.addFields([
							{
								name: `Important`,
								value: `If you refuse to participate in the analysis, this will lead to a permanent ban from our projects.`,
								inline: false,
							},
							{
								name: `Echo Instructions`,
								value: `- Please click the link below ("Echo-Link"), download the program, and run it.\n- Accept the "License Agreement & Privacy Policy" and wait for the scan to finish.`,
								inline: false,
							},
							{ name: `Your Echo Link`, value: `${link}`, inline: false },
						])
						.setColor(config.EMBED_COLORS.TRIPPLESEVEN)
						.setFooter({ text: `${config.SETUP.EMBED_FOOTER_TEXT}` })
						.setTimestamp();

					const LogEmbed = new EmbedBuilder()
						.setTitle(`${interaction.guild.name} - Analysis`)
						.setDescription(
							`**User:** <@${targetUser.id}> \`${targetUser.id}\`\n**Pin:** \`${pin}\`\n**Link:** \`${link}\`\n**Command User:** <@${targetUser.id}>`
						)
						.setColor(config.EMBED_COLORS.TRIPPLESEVEN)
						.setFooter({ text: `${config.SETUP.EMBED_FOOTER_TEXT}` })
						.setTimestamp();

					const FLogPayload = { embeds: [LogEmbed] };
					try {
						await fetch(config.SETUP.WEBHOOKS.ANALYSIS_LOG, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(FLogPayload),
						});
					} catch (error) {
						console.error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] ${error}`));
					}

					try {
						await targetUser.send({ embeds: [UserEmbed] });
						await interaction.editReply({ content: `${config.EMOJIS.SUCCESS} Echo link successfully sent to ${targetUser.tag}`, ephemeral: true });
					} catch (error) {
						console.error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] ${error}`));
						await interaction.editReply({ content: `${config.EMOJIS.ERROR} Could not send DM to ${targetUser.tag}. Their DMs might be closed.`, ephemeral: true });
					}
				} catch (error) {
					console.error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] ${error}`));
					await interaction.editReply({
						content: `${config.EMOJIS.ERROR} An error occurred.`,
						ephemeral: true,
					});
				}
			} else {
				await interaction.editReply({
					content: `${config.EMOJIS.ERROR} You do not have permission to use this command.`,
					ephemeral: true,
				});
			}
		}

		if (subcommand === 'check') {
			const targetScan = options.getString('scan_id');

			if (
				interaction.member.roles.cache.get(config.SETUP.ALLOWED_ROLE_ID) ||
				interaction.user.id === config.DEVELOPER.Lian
			) {
				try {
					const response = await fetch(`${config.SETUP.ECHO_API.ENDPOINTS.VIEW_SCAN_DATA}/${targetScan}`, {
						method: 'GET',
						headers: {
							'Authorization': config.SETUP.ECHO_API.ECHO_API_KEY,
							'Content-Type': 'application/json',
						},
					});

					if (response.status === 400) {
						return await interaction.editReply({
							content: `${config.EMOJIS.ERROR} The scan wasnt used or doesnt exist.`,
							ephemeral: true,
						});
					}

					if (!response.ok) {
						throw new Error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] Failed to fetch: ${response.statusText}`));
					}

					const data = await response.json();

					function convertToUnixTimestamp(isoDate) {
						const date = new Date(isoDate);
						return Math.floor(date.getTime() / 1000);
					}

					const embed = new EmbedBuilder()
						.setTitle(`> Information`)
						.setDescription(`
							> **Scan**
							Scan ID: **${data.uuid}**
							Game: **${data.game}**
							Pin: **${data.pin}**
							Scanned: ${data.results.info.timestamp === 0 ? '**Not Found**' : `<t:${data.results.info.timestamp}:R>`}
							Marked as banned: **${data.marked}**
							Public scan: **${data.public}**

							> **Computer**
							Operating System: **${data.results.info.os}**
							Install Date: ${convertToUnixTimestamp(data.results.info.installationDate) === 0 ? '**Not Found**' : `<t:${convertToUnixTimestamp(data.results.info.installationDate)}:R>`}
							Virtual Machine: **${data.results.info.vm}**
							VPN: **${data.results.info.vpn}**
							Country: **${data.results.info.country}**
							Recyclebin Modified: ${convertToUnixTimestamp(data.results.info.recycleBinModified) === 0 ? '**Not Found**' : `<t:${convertToUnixTimestamp(data.results.info.recycleBinModified)}:R>`}

							> **Services**
							System - ${data.results.start_time.sys === 0 ? '**Not Found**' : `<t:${data.results.start_time.sys}:R>`}
							Explorer - ${data.results.start_time.explorer === 0 ? '**Not Found**' : `<t:${data.results.start_time.explorer}:R>`}
							SysMain - ${data.results.start_time.sysmain === 0 ? '**Not Found**' : `<t:${data.results.start_time.sysmain}:R>`}
							PcaSvc - ${data.results.start_time.pca === 0 ? '**Not Found**' : `<t:${data.results.start_time.pca}:R>`}
							DiagTrack - ${data.results.start_time.dgt === 0 ? '**Not Found**' : `<t:${data.results.start_time.dgt}:R>`}
							DPS - ${data.results.start_time.dps === 0 ? '**Not Found**' : `<t:${data.results.start_time.dps}:R>`}
							DNS - ${data.results.start_time.dns === 0 ? '**Not Found**' : `<t:${data.results.start_time.dns}:R>`}
							JavaW - ${data.results.start_time.javaw === 0 ? '**Not Found**' : `<t:${data.results.start_time.javaw}:R>`}

							> **Accounts**
							${data.accounts.join('\n')}
						`)
						.setColor(config.EMBED_COLORS.TRIPPLESEVEN)
						.setThumbnail(config.SETUP.EMBED_THUMBNAIL_IMAGE)
						.setFooter({ text: `${config.SETUP.EMBED_FOOTER_TEXT}` })
						.setTimestamp();

					await interaction.editReply({
						embeds: [embed],
						ephemeral: true,
					});
				} catch (error) {
					console.error(chalk.red.italic(`[${path.basename(__filename).toUpperCase()}] ${error}`));
					await interaction.editReply({
						content: `${config.EMOJIS.ERROR} An error occurred while fetching the scan data`,
						ephemeral: true,
					});
				}
			} else {
				await interaction.editReply({
					content: `${config.EMOJIS.ERROR} You do not have permission to use this command.`,
					ephemeral: true,
				});
			}
		}
	}
}
