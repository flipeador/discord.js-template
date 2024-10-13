import {
    StringSelectMenuInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

/**
 * Represents a select menu interaction.
 * @param {StringSelectMenuInteraction} interaction
 */
export async function execute(interaction) {
    const data = interaction.client.bot.useId(interaction);

    if (data?.file?.endsWith('.js')) {
        const select = await import(`./selects/${data.file}`);
        return await select.execute(interaction, data);
    }
}

export default {
    execute
};
