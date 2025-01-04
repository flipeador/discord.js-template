import { MessageFlags, EmbedBuilder } from 'discord.js';

export class BaseError extends Error { }

/**
 * Generic client command interaction error.
 */
export class InteractionError extends BaseError {
    get content() {
        return this.message;
    }
}

/**
 * Ephemeral error displayed to the user.
 */
export class UserError extends InteractionError {
    get content() {
        return {
            embeds: [
                new EmbedBuilder({
                    title: '❌⠀An error has occurred',
                    description: this.message
                })
            ],
            flags: MessageFlags.Ephemeral
        };
    }
}
