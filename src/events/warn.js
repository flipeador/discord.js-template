import { Events } from 'discord.js';

import * as util from '@lib/util.js';

export const name = Events.Warn;

/**
 * Emitted for general warnings.
 * @param {String} info
 */
export async function execute(info) {
    util.log(info);
}
