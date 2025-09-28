import {
    MessageContextMenuCommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a message context menu interaction.
 * @param {MessageContextMenuCommandInteraction} interaction
 */
export async function execute(interaction, command) {
    return command.execute(interaction);
}

export default {
    execute
};
