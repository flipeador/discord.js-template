import {
    MessageFlags,
    ContainerBuilder,
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
    .addIntegerOption(_ => _
        .setName('dices')
        .setDescription('Dice quantity')
        .setDescriptionLocalizations({
            'es-ES': 'Cantidad de dados'
        })
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addIntegerOption(_ => _
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
    const container = new ContainerBuilder();

    const options = {
        components: [ container ],
        flags: MessageFlags.IsComponentsV2
    };

    container.addTextDisplayComponents({
        content: '⌛⠀Rolling the dice ...'
    });

    await interaction.reply(options);
    await util.timeout(3000, 5000);

    const dices = interaction.options.getInteger('dices') ?? 1;
    const sides = interaction.options.getInteger('sides') ?? 6;

    container.addSeparatorComponents({ /* small spacing */ });

    container.addTextDisplayComponents(
        Array.from({ length: dices }, () => ({
            content: `🎲⠀${util.random(1, sides)}`
        }))
    );

    await interaction.editReply(options);
}
