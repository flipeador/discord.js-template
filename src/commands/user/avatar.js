import {
    EmbedBuilder,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    InteractionContextType,
    ApplicationIntegrationType,
    UserContextMenuCommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

// Set the command as a Global Application Command.
// Include the command when registering global application commands.
export const global = true;

// Create API-compatible JSON data for the command.
export const data = new ContextMenuCommandBuilder()
    .setName('Get avatar')
    .setNameLocalizations({
        'es-ES': 'Obtener avatar'
    })
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(
        ApplicationIntegrationType.UserInstall,
        ApplicationIntegrationType.GuildInstall
    );

/**
 * Represents a user context menu interaction.
 * @param {UserContextMenuCommandInteraction} interaction
 */
export async function execute(interaction) {
    const userAvatar = interaction.targetUser.avatarURL({ size: 4096 });
    const userDisplayAvatar = interaction.targetUser.displayAvatarURL({ size: 4096 });
    const memberAvatar = interaction.targetMember?.avatarURL?.({ size: 4096 });
    const memberDisplayAvatar = interaction.targetMember?.displayAvatarURL?.({ size: 4096 });

    // The user must be force fetched for this property to be present or be updated.
    if (interaction.isOwner) {
        await interaction.deferReply({ ephemeral: true });
        await interaction.targetUser.fetch(true);
    }
    const userBanner = interaction.targetUser.bannerURL({ size: 4096 });

    await interaction.reply({
        embeds: [
            new EmbedBuilder({
                author: {
                    name: interaction.targetUser.tag,
                    url: userDisplayAvatar,
                    iconURL: userDisplayAvatar
                },
                description:
                    `[User avatar](${userAvatar})` +
                    (userBanner ? ` | [User banner](${userBanner})` : '') +
                    (memberAvatar ? ` | [Member avatar](${memberAvatar})` : ''),
                image: { url: memberDisplayAvatar || userDisplayAvatar },
                footer: { text: `ID:⠀${interaction.targetUser.id}` }
            })
        ],
        ephemeral: true
    });
}
