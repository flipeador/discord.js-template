import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ButtonInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';
import { CardDeck52, Game } from './game.js';

/**
 * Blackjack game.
 */
export class Blackjack extends Game {
    name = '🎴⠀Blackjack';
    maxPlayers = 2; // must be 2

    async main() {
        await this.initialize(() => {
            this.cardDeck52 = new CardDeck52();
            this.players.reset(() => ({ cards: '', score: 0 }));

            return {
                embeds: this.getEmbeds(this.players.current),
                components: this.getComponents()
            };
        });

        while (true) {
            let choise;

            if (this.players.current.user.bot) {
                // Random delay to make it look like the bot is thinking.
                await util.timeout(2000, 5000);
                // If the bot's score is less than or equal to 16, choose Hit.
                // If the bot's score is lower than the challenger's score, choose Hit.
                choise = (
                    this.players.current.data.score <= 16 ||
                    this.players.current.data.score < this.players.other.data.score ?
                    'hit' : 'stand'
                );
            }
            else choise = await this.awaitMessageComponent2();

            await this[choise]();
            this.players.next();

            await this.interaction.editReply({
                embeds: this.getEmbeds(this.players.current),
                components: this.getComponents()
            });

            this.noStand = false;
        }
    }

    /**
     * Request a card from the deck.
     */
    async hit() {
        const [card] = this.cardDeck52.withdraw(1, 10, 10, 10);

        if (card.value === 1) { // ace => 1 or 11
            if (this.players.current.user.bot)
                card.value = this.players.current.data.score > 10 ? 1 : 11;
            else {
                await this.interaction.editReply({
                    embeds: this.getEmbeds(
                        this.players.current,
                        `You got an Ace (${card.name}), choose a value.`
                    ),
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('1')
                                .setLabel('1')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('11')
                                .setLabel('11')
                                .setStyle(ButtonStyle.Primary)
                        )
                    ]
                });
                card.value = Number(await this.awaitMessageComponent2());
            }
        }

        this.players.current.data.cards = `${this.players.current.data.cards} ${card.name}`.trim();
        this.players.current.data.score += card.value;

        // If both players obtained the maximum score of 21, it is a tie.
        if (this.players.current.data.score === 21 && this.players.other.data.score === 21)
            await this.finish('🤲⠀It\'s a tie.');
        // The current player wins if obtained the maximum score of 21 and the opponent's score is less than 10.
        if (this.players.current.data.score === 21 && this.players.other.data.score < 10)
            await this.finish(`🏆⠀${this.players.current} won the game.`);
        // The current player loses if went over 21 score.
        // The current player loses if the opponent has the maximum score of 21.
        if (this.players.current.data.score > 21 || this.players.other.data.score === 21)
            await this.finish(`🏆⠀${this.players.other} won the game.`);
    }

    /**
     * End the turn and stop without taking a card.
     */
    async stand() {
        // If the opponent has the maximum score of 21, the current player loses the game.
        if (this.players.other.data.score === 21)
            await this.finish(`🏆⠀${this.players.other} won the game.`);
        // If the current player has the same or higher score than the opponent, lock the Stand button for one round.
        // This prevents both players from infinitely abusing the Stand button, benefiting the one with the same or higher score.
        if (this.players.current.data.score >= this.players.other.data.score)
            this.noStand = true;
    }

    /**
     * Give up a half-bet and retire from the game. \
     * This option is only available as the first decision for each player.
     */
    async surrender() {
        await this.finish(`🏆⠀${this.players.other} won the game. ${this.players.current} has given up a half-bet and retires from the game.`);
    }

    /**
     * Update the message and end the game.
     * @param {string} info
     */
    async finish(info) {
        await this.interaction.editReply({
            embeds: this.getEmbeds(null, info),
            components: []
        });

        throw undefined;
    }

    /**
     * Get the embeds for the message.
     * @param {Player?} player
     * @param {string?} info
     */
    getEmbeds(player, info) {
        return [
            new EmbedBuilder({
                title: this.name,
                description:
                    `${this.challenger} has challenged ${this.opponents} to a Blackjack game.` +
                    (player ? `\n\n→⠀It is ${player}'s turn.` : '') +
                    (info ? `\n\n${info}` : ''),
                fields: this.players.map(player => ({
                    name: `${player.user.username} (${player.data.score})`,
                    value: player.data.cards || '_no cards_',
                    inline: true
                })),
                footer: !player ? null : {
                    text: `Probability of losing:⠀${Blackjack.getLoseProb(player)}%.`
                }
            })
        ];
    }

    /**
     * Message component filter.
     * @param {ButtonInteraction} interaction
     */
    async filter(interaction) {
        return this.players.current.user.id === interaction.user.id;
    }

    /**
     * Wait for the players to choose.
     * @return {Promise<string>} The button pressed.
     */
    async awaitMessageComponent2() {
        const component = await this.awaitMessageComponent({ time: 1 * 60 * 1000 });
        if (component) return component.customId;

        if (this.players.current.data.score)
            await this.finish(`🏆⠀${this.players.other} won the game. ${this.players.current} has not responded in time.`);

        await this.finish(`The game has been cancelled. ${this.players.current} has not responded in time.`);
    }

    /**
     * Get the components for the message.
     */
    getComponents() {
        return [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Hit')
                    .setEmoji('💢')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(this.players.current.user.bot)
                    .setCustomId('hit'),
                new ButtonBuilder()
                    .setLabel('Stand')
                    .setEmoji('🤚')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.players.current.user.bot || !!this.noStand)
                    .setCustomId('stand'),
                new ButtonBuilder()
                    .setLabel('Surrender')
                    .setEmoji('🛑')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(this.players.current.user.bot || !!this.players.current.data.score)
                    .setCustomId('surrender')
            )
        ];
    }

    /**
     * Get the probability of losing on Hit.
     * @param {Player} player
     * @return {number}
     */
    static getLoseProb(player) {
        if (player.data.score <= 11) return 0;
        if (player.data.score >= 21) return 100;
        return {
            '12': 31,
            '13': 39,
            '14': 56,
            '15': 58,
            '16': 62,
            '17': 69,
            '18': 77,
            '19': 85,
            '20': 92
        }[`${player.data.score}`];
    }
}
