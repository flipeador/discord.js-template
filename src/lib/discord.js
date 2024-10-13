export async function trySend(target, ...args) {
    try {
        // Text channel.
        if (!target.token)
            return await target.send(...args);
        // Whether the interaction has already been replied to.
        if (target.replied)
            return await target.followUp(...args);
        // Whether the reply to the interaction has been deferred.
        if (target.deferred)
            try { return await target.editReply(...args); }
            catch { return await target.followUp(...args); }
        return await (target._reply || target.reply)(...args);
    } catch { /* EMPTY */ }
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
