import {
    Guild, // eslint-disable-line no-unused-vars
    Events
} from 'discord.js';

import * as util from '@lib/util.js';

export const name = Events.GuildCreate;

/**
 * Emitted whenever the bot joins a guild.
 * @param {Guild} guild The created guild.
 */
export async function execute(guild) {
    util.log(util.stripIndents(`
        The bot joined a guild:
            NAME ${guild.name}
            ID   ${guild.id}
    `));
}
