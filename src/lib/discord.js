import { escapeMarkdown } from 'discord.js';

import * as util from '@lib/util.js';

export async function trySend(target, ...args) {
    // const ephemeral = args.find(arg => arg?.ephemeral);

    try {
        // Text channel.
        if (!target.token)
            return await target.send(...args);

        // Whether the interaction has already been replied to.
        if (target.replied)
            return await target.followUp(...args);

        // Whether the reply to the interaction has been deferred.
        if (target.deferred /*&& !!ephemeral === !!target.ephemeral*/)
            try { return await target.editReply(...args); }
            catch { return await target.followUp(...args); }

        return await (target._reply || target.reply)(...args);
    }
    catch { /* EMPTY */ }
}

export async function send(target, ...args) {
    // Text channel?.
    if (!target.token) return target.send(...args);
    // Whether the interaction has already been replied to.
    if (target.replied) return target.followUp(...args);
    // Whether the reply to the interaction has been deferred.
    if (target.deferred) return target.editReply(...args);
    return (target._reply || target.reply)(...args);
}

export function link(text, url, info) {
    if (!url) return text;
    if (info) return `[${text}](<${url}> "${info}")`;
    return `[${text}](<${url}>)`;
}

/**
 * Wrap an async filter for sequential execution.
 * @param {Function} filter
 * The asynchronous filter function. \
 * The execution chain stops once the filter returns a truthy value.
 * @returns {()=>Promise<boolean>}
 */
export function syncFilter(filter) {
    if (typeof(filter) !== 'function')
        throw new TypeError('Invalid function');

    // Do nothing if the filter is not an async function.
    if (!(filter instanceof util.AsyncFunction))
        return filter;

    let result = false;
    let promise = Promise.resolve();

    return interaction => {
        // Discord expects a response to all interactions within 3 seconds.
        // We defer the update for all interactions before calling the filter.
        // Don't await here, any await must be inside the `promise.then` callback.
        const defer = interaction?.deferUpdate?.().then?.(() => true, () => false);

        return promise = promise.then(async () => {
            if (result === true) return true;
            if (await defer === false) return false;
            return result = !!await filter(interaction);
        });
    };
}

/**
 * Escapes any Discord-flavored markdown in a string.
 * @param {string} text
 * @returns {string}
 * @see https://discord.js.org/docs/packages/discord.js/main/escapeMarkdown:Function
 */
export function escape(text, options={}) {
    options.heading ??= true;
    options.maskedLink ??= true;
    options.numberedList ??= true;
    options.bulletedList ??= true;
    return escapeMarkdown(text, options);
}
