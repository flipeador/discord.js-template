import {
    ButtonInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a button interaction.
 * @param {ButtonInteraction} interaction
 */
export async function execute(interaction) {
    const data = interaction.client.bot.useId(interaction);

    if (data?.file?.endsWith('.js')) {
        const button = await import(`./buttons/${data.file}`);
        return await button.execute(interaction, data);
    }
}

export default {
    execute
};
