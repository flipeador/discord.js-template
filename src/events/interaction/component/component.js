import {
    MessageComponentInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import button from './button/button.js';
import select from './select/select.js';

/**
 * Represents a message component interaction.
 * @param {MessageComponentInteraction} interaction
 */
export async function execute(interaction) {
    if (interaction.isButton())
        return button.execute(interaction);

    if (interaction.isAnySelectMenu())
        return select.execute(interaction);
}

export default {
    execute
};
