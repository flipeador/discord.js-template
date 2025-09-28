import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import { Blackjack } from '@lib/games/blackjack.js';

// Include command when registering global application commands.
export const global = true;

// Create API-compatible JSON data for the command.
export const data = new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Blackjack game')
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(
        ApplicationIntegrationType.UserInstall,
        ApplicationIntegrationType.GuildInstall
    )
    .addUserOption(_ => _
        .setName('p2')
        .setDescription('Player #2')
    );

/**
 * Represents a slash command interaction.
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    await new Blackjack(interaction).run();
}
