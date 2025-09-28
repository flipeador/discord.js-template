import {
    ButtonInteraction, // eslint-disable-line no-unused-vars
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Collection
} from 'discord.js';

import * as util from '@lib/util.js';
import { Player, Game } from './game.js';

const weapons = new Collection([
    // Rock blunts Scissors and crushes Lizard.
    ['rock', ['scissors', 'lizard']],
    // Paper covers Rock and disproves Spock.
    ['paper', ['rock', 'spock']],
    // Scissors cuts Paper and decapitates Lizard.
    ['scissors', ['paper', 'lizard']],
    // Spock vaporizes Rock and smashes Scissors.
    ['spock', ['rock', 'scissors']],
    // Lizard eats Paper and poisons Spock.
    ['lizard', ['paper', 'spock']]
]);

const legends = {
    // Rock
    'rock-scissors': [
        'W threw a 🪨rock and blunted L\'s ✂️scissors into useless scrap.',
        'W smashed a 🪨rock onto L\'s ✂️scissors, leaving them twisted and broken.',
        'W hurled a 🪨rock with such force that L\'s ✂️scissors shattered into a million pieces!'
    ],
    'rock-lizard': [
        'W hurled a 🪨rock and crushed L\'s 🦎lizard flat as a pancake.',
        'W lobbed a 🪨rock and splattered L\'s 🦎lizard into a sticky mess.',
        'W smashed a 🪨rock down on L\'s 🦎lizard, turning it into a gooey pulp.'
    ],

    // Paper
    'paper-rock': [
        'W wrapped up L\'s 🪨rock with 🧻paper, leaving it completely powerless.',
        'W covered L\'s 🪨rock in 🧻paper and suffocated its might.',
        'W smothered L\'s 🪨rock with 🧻paper, reducing it to a decorative coaster.'
    ],
    'paper-spock': [
        'W showed a 🧻paper and disproved all of L\'s 🖖Spock-like logic.',
        'W slapped a 🧻paper onto L\'s 🖖Spock, breaking its logic circuits.',
        'W shredded L\'s 🖖Spock\'s argument with a well-placed 🧻paper.'
    ],

    // Scissors
    'scissors-paper': [
        'W snipped L\'s 🧻paper neatly in two with a pair of sharp ✂️scissors.',
        'W sliced through L\'s 🧻paper like butter with ✂️scissors.',
        'W tore L\'s 🧻paper into shreds with their deadly ✂️scissors!'
    ],
    'scissors-lizard': [
        'W swung some ✂️scissors and decapitated L\'s poor 🦎lizard in one move.',
        'W slashed at L\'s 🦎lizard with ✂️scissors, leaving it lifeless on the ground.',
        'W chopped L\'s 🦎lizard into pieces with precision ✂️scissor strikes!'
    ],

    // Spock
    'spock-rock': [
        'W gestured with 🖖Spock-like wisdom and vaporized L\'s 🪨rock instantly.',
        'W unleashed a blast of 🖖Spock energy, turning L\'s 🪨rock into fine dust.',
        'W used 🖖Spock\'s logic to obliterate L\'s 🪨rock in a flash of light.'
    ],
    'spock-scissors': [
        'W used 🖖Spock\'s strength and smashed L\'s ✂️scissors to bits.',
        'W crushed L\'s ✂️scissors under the power of 🖖Spock.',
        'W shattered L\'s ✂️scissors with a 🖖Spock-powered strike!'
    ],

    // Lizard
    'lizard-paper': [
        'W\'s 🦎lizard sneakily munched on L\'s 🧻paper, leaving nothing behind.',
        'W\'s 🦎lizard shredded L\'s 🧻paper into a soggy mess.',
        'W\'s 🦎lizard devoured L\'s 🧻paper, burping in satisfaction.'
    ],
    'lizard-spock': [
        'W unleashed a 🦎lizard that poisoned L\'s 🖖Spock with a toxic bite.',
        'W\'s 🦎lizard sank its venomous teeth into L\'s 🖖Spock, ending the battle.',
        'W\'s 🦎lizard injected L\'s 🖖Spock with a deadly poison, leaving no hope.'
    ]
};

/**
 * Rock-paper-scissors game.
 */
export class RPS extends Game {
    name = '🪨 Rock - 🧻 Paper - ✂️ Scissors';
    maxPlayers = 2; // must be 2

    async main() {
        await this.initialize(() => ({
            embeds: this.getEmbeds(),
            components: RPS.getComponents()
        }));

        for (let i = 0; i < 3; ++i) {
            this.players.reset(); // reset weapons

            // Choose a random weapon if the bot is playing.
            if (this.bot)
                this.players.set(new Player(this.botUser, weapons.randomKey()));

            // Wait for players to choose a weapon (3 minutes).
            if (!await this.awaitMessageComponent({ time: 3 * 60 * 1000 }))
                await this.abort('Players have not responded in time.');

            const [first, second] = this.players.values();

            if (first.data === second.data) {
                await this.update(
                    '🤲⠀**It is a draw!**' +
                    '\nBoth players have chosen the same gesture and must repeat the move.'
                );
                continue;
            }

            let winner, loser;
            const firstWeaponBeats = weapons.get(first.data);
            if (firstWeaponBeats.includes(second.data))
                [winner, loser] = [first, second];
            else [winner, loser] = [second, first];

            const legend = util.choise(legends[`${winner.data}-${loser.data}`])
                .replace('W', winner.toString()) // replace `W` with the winner
                .replace('L', loser.toString()); // replace `L` with the loser

            return this.update(`🏆⠀**Winner!**\n${legend}`, true);
        }

        await this.abort('The game has ended due to lack of attempts.');
    }

    /**
     * Update the message.
     * @param {String} info The information for the user.
     * @param {Boolean} end Whether the game is going to end.
     */
    async update(info, end) {
        await this.interaction.editReply({
            embeds: this.getEmbeds(info, end),
            components: end ? [] : RPS.getComponents()
        });
    }

    /**
     * Abort the game.
     * @param {string} reason
     */
    async abort(reason) {
        await this.update(`🛑⠀**The game has been cancelled.**\n${reason}`, true);
        throw null;
    }

    /**
     * Message component filter.
     * @param {ButtonInteraction} interaction
     */
    async filter(interaction) {
        const player = new Player(interaction, interaction.customId);
        return this.players.update(player)?.ready?.();
    }

    /**
     * Get the embeds for the message.
     */
    getEmbeds(info, end) {
        return [
            new EmbedBuilder({
                title: this.name,
                description:
                    `**${this.challenger} has challenged ${this.opponents} to a rock-paper-scissors game.**` +
                    (end ? '' : '\n\n→⠀Players must press a button to choose their weapon.') +
                    (info ? `\n\n${info}` : '')
            })
        ];
    }

    /**
     * Get the components for the message.
     */
    static getComponents() {
        return [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setEmoji('🪨')
                    .setCustomId('rock')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setEmoji('🧻')
                    .setCustomId('paper')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setEmoji('✂️')
                    .setCustomId('scissors')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setEmoji('🖖')
                    .setCustomId('spock')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setEmoji('🦎')
                    .setCustomId('lizard')
                    .setStyle(ButtonStyle.Primary)
            )
        ];
    }
}
