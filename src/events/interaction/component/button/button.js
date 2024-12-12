import {
    ButtonInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a button interaction.
 * @param {ButtonInteraction} interaction
 */
export async function execute(interaction) {
    const data = interaction.client.bot.useId(interaction);

    if (data?.module?.endsWith?.('.js')) {
        const module = await import(`./buttons/${data.module}`);
        return await module.execute(interaction, data);
    }
}

export default {
    execute
};
