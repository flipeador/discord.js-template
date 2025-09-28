import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import { RPS } from '@lib/games/rps.js';

// Include command when registering global application commands.
export const global = true;

// Create API-compatible JSON data for the command.
export const data = new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Rock-paper-scissors game')
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
    await new RPS(interaction).run();
}
