import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import { Guess } from '@lib/games/guess.js';

// Include command when registering global application commands.
export const global = true;

// Create API-compatible JSON data for the command.
export const data = new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Guess the word or phrase game')
    .setContexts(InteractionContextType.Guild)
    // The game only works on servers where the application is installed.
    // This is because the game requires to view a channel to collect messages.
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addStringOption(opt => opt
        .setName('secret')
        .setDescription('Secret word or phrase')
        .setMaxLength(1024)
        .setRequired(true)
    )
    .addStringOption(opt => opt
        .setName('hint')
        .setDescription('Hint')
        .setMaxLength(1024)
        .setRequired(true)
    )
    .addStringOption(opt => opt
        .setName('timeout')
        .setDescription('Timeout')
        .setMaxLength(19)
    );

/**
 * Represents a slash command interaction.
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    await new Guess(interaction).run();
}
