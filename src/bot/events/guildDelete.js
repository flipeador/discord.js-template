import {
    Guild, // eslint-disable-line no-unused-vars
    Events
} from 'discord.js';

import * as util from '@lib/util.js';

export const name = Events.GuildDelete;

/**
 * Emitted whenever a guild kicks the bot or the guild is deleted/left.
 * @param {Guild} guild The guild that was deleted.
 */
export async function execute(guild) {
    util.log(util.stripIndents(`
        The bot left a guild:
            NAME ${guild.name}
            ID   ${guild.id}
    `));
}
