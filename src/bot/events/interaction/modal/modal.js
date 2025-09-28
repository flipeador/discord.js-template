import {
    ModalSubmitInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a modal interaction.
 * @param {ModalSubmitInteraction} interaction
 */
export async function execute(interaction) {
    const data = interaction.client.bot.useId(interaction);

    if (data?.module?.endsWith?.('.js')) {
        const module = await import(`./forms/${data.module}`);
        return await module.execute(interaction, data);
    }
}

export default {
    execute
};
