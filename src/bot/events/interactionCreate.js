/**
 * This module processes all client interaction events and dispatches them to other modules.
 * It also receives and processes all unhandled errors during a command interaction execution.
 *
 *
 *                                       BaseInteraction
 * isChatInputCommand()                  ChatInputCommandInteraction
 *     isCommand()                       CommandInteraction
 *     isContextMenuCommand()            ContextMenuCommandInteraction
 *         isUserContextMenuCommand()    UserContextMenuCommandInteraction
 *         isMessageContextMenuCommand() MessageContextMenuCommandInteraction
 * isAutocomplete()                      AutocompleteInteraction
 * isMessageComponent()                  MessageComponentInteraction
 *     isButton()                        ButtonInteraction
 *     isAnySelectMenu()                 AnySelectMenuInteraction
 *         isChannelSelectMenu()         ChannelSelectMenuInteraction
 *         isMentionableSelectMenu()     MentionableSelectMenuInteraction
 *         isRoleSelectMenu()            RoleSelectMenuInteraction
 *         isStringSelectMenu()          StringSelectMenuInteraction
 *         isUserSelectMenu()            UserSelectMenuInteraction
 * isModalSubmit()                       ModalSubmitInteraction
 *
 *
 * 1   Ping
 * 2   ApplicationCommand                ChatInputCommandInteraction
 * 3   MessageComponent                  MessageComponentInteraction
 * 4   ApplicationCommandAutocomplete    AutocompleteInteraction
 * 5   ModalSubmit                       ModalSubmitInteraction
 */

import {
    Events,
    MessageFlags,
    DiscordAPIError,
    EmbedBuilder,
    BaseInteraction, // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';
import * as errors from '@lib/error.js';
import * as discord from '@lib/discord.js';

const APP_OWNER_ID = process.env.APP_OWNER_ID;

import command from './interaction/command/command.js';
import component from './interaction/component/component.js';
import autocomplete from './interaction/autocomplete/autocomplete.js';
import modal from './interaction/modal/modal.js';

export const name = Events.InteractionCreate;

/**
 * Emitted when an interaction is created.
 * @param {BaseInteraction} interaction
 */
export async function execute(interaction) {
    interaction.isOwner = interaction.user.id === APP_OWNER_ID;

    interaction._reply = interaction.reply.bind(interaction);
    interaction.reply = (...args) => discord.send(interaction, ...args);
    interaction.tryReply = (...args) => discord.trySend(interaction, ...args);

    try {
        if (interaction.isMessageComponent())
            await component.execute(interaction);
        else if (interaction.isModalSubmit())
            await modal.execute(interaction);
        else if (interaction.isAutocomplete())
            await autocomplete.execute(interaction);
        else if (interaction.isCommand())
            await command.execute(interaction);
    }
    catch (error) {
        // Discord API error.
        // https://discord.com/developers/docs/topics/opcodes-and-status-codes
        if (error instanceof DiscordAPIError) {
            await interaction.tryReply({
                embeds: [
                    new EmbedBuilder({
                        author: {
                            name: `Discord API Error #${error.code}`,
                            url: 'https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes',
                            iconURL: 'https://www.google.com/s2/favicons?domain=discord.com&sz=128'
                        },
                        description: error.message
                    })
                ]
            });
        }
        // Client command interaction error.
        else if (error instanceof errors.InteractionError) {
            await interaction.tryReply(error.content);
        }
        // Any other unexpected non-falsy error.
        else if (error) {
            util.log('Interaction error:', error);

            await interaction.tryReply('❌⠀An error occurred while processing the interaction.');

            if (interaction.isOwner) {
                const message = typeof(error) === 'string' ? error : error.message;
                await interaction.tryReply({
                    content: util.shorten(`${message ?? error}`, 4000),
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
}
