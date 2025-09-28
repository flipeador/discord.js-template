import {
    AutocompleteInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';

/**
 * Represents an autocomplete interaction.
 * @param {AutocompleteInteraction} interaction
 */
export async function execute(interaction) {
    const command = interaction.client.bot.commands.get(interaction.commandName);

    if (command) {
        let autocomplete;

        try {
            autocomplete = await import(`./autocomplete/${interaction.commandName}.js`);
        } catch { /* EMPTY */ }

        if (autocomplete)
            return autocomplete.execute(interaction);
    }

    util.log(`Unknown autocomplete interaction: ${interaction.commandName}`);
}

export default {
    execute
};
