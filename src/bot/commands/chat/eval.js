import {
    SlashCommandBuilder,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionContextType,
    ApplicationIntegrationType,
    CommandInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '@lib/util.js';

// Create API-compatible JSON data for the command.
export const data = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluate JavaScript code and executes it')
    .setDescriptionLocalizations({
        'es-ES': 'Evalúa código JavaScript y lo ejecuta'
    })
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel
    )
    .setIntegrationTypes(
        ApplicationIntegrationType.UserInstall,
        ApplicationIntegrationType.GuildInstall
    )
    .addUserOption(_ => _
        .setName('target')
        .setDescription('Mention a member')
        .setDescriptionLocalizations({
            'es-ES': 'Menciona a un miembro'
        })
    )
    .addBooleanOption(_ => _
        .setName('ephemeral')
        .setDescription('Whether the reply should be ephemeral')
        .setDescriptionLocalizations({
            'es-ES': 'Si la respuesta debe ser efímera'
        })
    );

/**
 * Represents a slash command interaction.
 * @param {CommandInteraction} interaction
 */
export async function execute(interaction) {
    // Ignore if it is not executed by the owner.
    if (!interaction.isOwner) throw null;

    const target = interaction.options.getUser('target');
    // By default, the message is ephemeral if the target is not specified.
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? !target;

    // The name of the file that handles the event when the modal is submitted.
    const module = 'eval.js'; // bot/events/interaction/modal/forms/eval.js

    // Create a custom ID and associate data with it.
    const customId = interaction.client.bot.createId({ target, ephemeral, module });

    const defaultValue = util.stripIndents(/* js */`
        (interaction) => {
            // This code is evaluated in 'bot.js'.
            return interaction.client.bot.eval(ctx => {
                // This code is evaluated in 'index.js'.
                return 'Shard ID: ' + ctx.shard.id;
            });
        }
    `);

    await interaction.showModal(
        new ModalBuilder({ customId })
            .setTitle('JavaScript Eval')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setRequired(true)
                        .setCustomId('code')
                        .setLabel('Expresion')
                        .setValue(defaultValue)
                        .setStyle(TextInputStyle.Paragraph)
                )
            )
    );
}
