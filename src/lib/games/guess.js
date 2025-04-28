import {
    Message, // eslint-disable-line no-unused-vars
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import { Game } from './game.js';
import * as util from '@lib/util.js';
import * as discord from '@lib/discord.js';
import { UserError } from '@lib/error.js';

export class Guess extends Game {
    /**
     * Create a Guess game instance.
     * @param {CommandInteraction} interaction
     */
    constructor(interaction) {
        super(interaction);

        this.hint = interaction.options.getString('hint');
        this.secret = interaction.options.getString('secret');
        this.timeout = interaction.options.getString('timeout');
    }

    async main() {
        this.answer = this.secret.toLowerCase();
        this.time = util.duration(this.timeout ?? '10m');

        if (isNaN(this.time))
            throw new UserError('The date format provided is invalid.');
        if (this.time < 10_000 || this.time > 600_000)
            throw new UserError('The duration must be between 10 seconds and 10 minutes.');

        const container = new ContainerBuilder();
        const timestamp = Math.floor((Date.now() + this.time) / 1000);

        // Respond with an ephemeral message to avoid disclosing the secret.
        await this.interaction.reply({
            components: [
                container.addTextDisplayComponents({ content: '✅' })
            ],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });

        // Follow up with a message announcing the game, visible to all members.
        this.message = await this.interaction.followUp({
            components: [
                container.spliceComponents(0, 1,
                    new TextDisplayBuilder({
                        content: util.stripIndents(`
                            # ❓⠀Guessing game!
                            Guess the word or phrase ${this.challenger} is thinking.
                            Mention ${this.botUser} and write your answer in this channel.
                            ### 💡⠀Hint
                            ${this.hint}\n
                            -# ⌛⠀Ends <t:${timestamp}:R>.
                        `)
                    })
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        // Start collecting messages.
        const message = await this.awaitMessages({ time: this.time })
            .then(messages => messages?.first?.()); // single message

        await this.message.reply({
            components: [
                container.spliceComponents(0, 1,
                    new TextDisplayBuilder({
                        content: util.stripIndents(`
                            ## ${message ? '🏆⠀Winner!' : '⏰⠀Timeout'}
                            ${
                                message ?
                                `${message.author} got the [correct answer](<${message.url}>)!` :
                                'No one has responded in time.'
                            }
                            ### Answer
                            ${discord.escape(this.secret)}
                        `)
                    })
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });
    }

    /**
     * The filter applied to the message collector.
     * @param {Message} message The message collected.
     * @returns {boolean} Whether to stop collecting messages.
     */
    filter(message) {
        return message.content.toLowerCase()
            // Remove all mentions.
            //
            // Note: User mentions with an exclamation mark are deprecated.
            // https://discord.com/developers/docs/reference#message-formatting
            .replace(/<@!?\d+>/g, '')
            .trim().startsWith(this.answer);
    }
}
