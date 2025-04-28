import {
    MessageFlags,
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
    const options = { size: 4096 };

    const userAvatar = interaction.targetUser.avatarURL(options);
    const userBanner = interaction.targetUser.bannerURL(options);
    const memberBanner = interaction.targetMember?.bannerURL?.(options);
    const memberAvatar = interaction.targetMember?.avatarURL?.(options);

    const userDisplayAvatar = interaction.targetUser.displayAvatarURL(options);
    const memberDisplayAvatar = interaction.targetMember?.displayAvatarURL?.(options);

    await interaction.reply({
        embeds: [
            new EmbedBuilder({
                author: {
                    url: userDisplayAvatar,
                    iconURL: userDisplayAvatar,
                    name: interaction.targetUser.tag
                },
                description:
                    (userAvatar ? `[User avatar](<${userAvatar}>)` : '') +
                    (userBanner ? ` | [User banner](<${userBanner}>)` : '') +
                    (memberAvatar ? ` | [Member avatar](<${memberAvatar}>)` : '') +
                    (memberBanner ? ` | [Member banner](<${memberBanner}>)` : ''),
                image: { url: memberDisplayAvatar || userDisplayAvatar },
                footer: { text: `ID:⠀${interaction.targetUser.id}` }
            })
        ],
        flags: MessageFlags.Ephemeral
    });
}
