import {
    User, // eslint-disable-line no-unused-vars
    ModalSubmitInteraction // eslint-disable-line no-unused-vars
} from 'discord.js';

import * as util from '../../../../lib/util.js';

/**
 * Represents a modal submit interaction.
 * @param {ModalSubmitInteraction} interaction
 * @param {object} data
 * @param {User} data.target
 * @param {boolean} data.ephemeral
 */
export async function execute(interaction, data) {
    // Ignore if it is not executed by the owner.
    if (!interaction.isOwner) throw null;

    const { target, ephemeral } = data;

    await interaction.deferReply({ ephemeral });

    let evaled = await util.evalfn(
        interaction.fields.getTextInputValue('code'),
        interaction
    );

    if (typeof(evaled) !== 'string')
        evaled = util.node.inspect(evaled);

    const content = (target ? `${target}\n` : '') + '```js\n\t\n```';

    evaled = evaled.replaceAll('`', 'ˋ');
    evaled = util.shorten(evaled, 2000 - content.length + 1);

    await interaction.editReply(content.replace('\t', evaled));
}