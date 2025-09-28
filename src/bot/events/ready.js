import {
    Client, // eslint-disable-line no-unused-vars
    Events
} from 'discord.js';

export const once = true;
export const name = Events.ClientReady;

/**
 * Emitted when the client becomes ready to start working.
 * @param {Client} client
 */
export async function execute(client) {
    await client.bot.loadCommands();
}
