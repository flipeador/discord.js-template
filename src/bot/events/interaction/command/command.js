import {
    ChatInputCommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';

import contextmenu from './contextmenu/contextmenu.js';

/**
 * Represents a command interaction.
 * @param {ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
    const command = interaction.client.bot.commands.get(interaction.commandName);

    if (command) {
        if (interaction.isContextMenuCommand())
            return contextmenu.execute(interaction, command);
        return command.execute(interaction);
    }

    util.log(`Unknown command interaction: ${interaction.commandName}`);
}

export default {
    execute
};
