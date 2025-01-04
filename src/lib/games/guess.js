import {
    Message, // eslint-disable-line no-unused-vars
    MessageFlags,
    EmbedBuilder,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import { Game } from './game.js';
import * as util from '@lib/util.js';
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

        // Respond with an ephemeral message to avoid disclosing the secret.
        await this.interaction.reply({ content: '✅', flags: MessageFlags.Ephemeral });

        // Create a Unix timestamp, in seconds.
        const timestamp = Math.floor((Date.now() + this.time) / 1000);

        this.message = await this.interaction.followUp({
            embeds: [
                new EmbedBuilder({
                    title: '❓⠀Guessing game!',
                    description:
                        `Guess the word or phrase ${this.challenger} is thinking.` +
                        `\nMention ${this.botUser} and write your answer in this channel.` +
                        `\n\n⌛⠀Ends <t:${timestamp}:R>.`, // styled Unix timestamp (relative time)
                    fields: this.hint ? [{ name: '💡⠀Hint', value: this.hint }] : []
                })
            ]
        });

        // Start collecting messages.
        const message = await this.awaitMessages({ time: this.time })
            .then(messages => messages?.first?.()); // single message

        await this.message.reply({
            embeds: [
                new EmbedBuilder({
                    title: message ? '🏆⠀Winner!' : '⏰⠀Timeout',
                    description: message ?
                        `${message.author} got the [correct answer](${message.url})!` :
                        'No one has responded in time.',
                    fields: [{ name: 'Answer', value: this.secret }]
                })
            ]
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
            // User mentions with an exclamation mark are deprecated.
            // https://discord.com/developers/docs/reference#message-formatting
            .replace(/<@!?\d+>/g, '')
            .trim().startsWith(this.answer);
    }
}
