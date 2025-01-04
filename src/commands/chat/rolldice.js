import {
    SlashCommandBuilder,
    InteractionContextType,
    ApplicationIntegrationType,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';

// Include command when registering global application commands.
export const global = true;

// Create API-compatible JSON data for the command.
export const data = new SlashCommandBuilder()
    .setName('rolldice')
    .setDescription('Roll dices')
    .setDescriptionLocalizations({
        'es-ES': 'Tirar los dados'
    })
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(
        ApplicationIntegrationType.UserInstall,
        ApplicationIntegrationType.GuildInstall
    )
    .addIntegerOption(opt => opt
        .setName('dices')
        .setDescription('Dice quantity')
        .setDescriptionLocalizations({
            'es-ES': 'Cantidad de dados'
        })
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addIntegerOption(opt => opt
        .setName('sides')
        .setDescription('Face quantity')
        .setDescriptionLocalizations({
            'es-ES': 'Cantidad de caras'
        })
        .setMinValue(2)
        .setMaxValue(Number.MAX_SAFE_INTEGER)
    );

/**
 * Represents a slash command interaction.
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    await interaction.reply({
        content: '⌛⠀Rolling the dice ...'
    });

    const dices = interaction.options.getInteger('dices') ?? 1;
    const sides = interaction.options.getInteger('sides') ?? 6;

    // Simulation of waiting while the dice roll.
    await util.timeout(2000, 5000);

    // Avoid using:
    //   const reply = await interaction.reply({ fetchReply: true });
    //   await reply.edit(...);
    // The above code might throw 'ChannelNotCached' for user apps if
    // the command is invoked in a server where the bot is not in.
    // https://github.com/discordjs/discord.js/issues/10441
    await interaction.editReply(
        Array.from(
            { length: dices },
            () => `🎲⠀${util.random(1, sides)}`
        ).join('\n')
    );
}
