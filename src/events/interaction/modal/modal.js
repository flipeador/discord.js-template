import {
    ModalSubmitInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a modal interaction.
 * @param {ModalSubmitInteraction} interaction
 */
export async function execute(interaction) {
    const data = interaction.client.bot.useId(interaction);

    if (data?.file?.endsWith('.js')) {
        const modal = await import(`./forms/${data.file}`);
        return await modal.execute(interaction, data);
    }
}

export default {
    execute
};
