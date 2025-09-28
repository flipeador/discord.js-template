import {
    ContextMenuCommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';

import user from './user/user.js';
import message from './message/message.js';

/**
 * Represents a context menu interaction.
 * @param {ContextMenuCommandInteraction} interaction
 */
export async function execute(interaction, command)
{
    if (interaction.isUserContextMenuCommand())
        return user.execute(interaction, command);

    if (interaction.isMessageContextMenuCommand())
        return message.execute(interaction, command);

    util.log(`Unknown context menu interaction: ${interaction.commandName}`);
}

export default {
    execute
};
