import {
    UserContextMenuCommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a user context menu interaction.
 * @param {UserContextMenuCommandInteraction} interaction
 */
export async function execute(interaction, command) {
    return command.execute(interaction);
}

export default {
    execute
};
