import {
    StringSelectMenuInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a select menu interaction.
 * @param {StringSelectMenuInteraction} interaction
 */
export async function execute(interaction) {
    const data = interaction.client.bot.useId(interaction);

    if (data?.module?.endsWith?.('.js')) {
        const module = await import(`./selects/${data.module}`);
        return await module.execute(interaction, data);
    }
}

export default {
    execute
};
