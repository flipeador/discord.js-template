import process from 'node:process';
import { version, ShardingManager } from 'discord.js';

import * as util from './lib/util.js';
import { database } from './database/database.js';

util.log(`pid ${process.pid} | node.js ${process.version} | discord.js ${version}`);

const manager = new ShardingManager(
    './src/bot.js',
    {
        mode: 'process',
        execArgv: [
            '--expose-gc',
            '--trace-warnings',
            '--max-old-space-size=4096'
        ],
        token: process.env.TOKEN
    }
);

manager.on('shardCreate', shard => {
    util.log(`[${shard.id}] Shard Create.`);

    shard.on('death', () => {
        util.log(`[${shard.id}] Shard Death.`);
    });

    shard.on('disconnect', () => {
        util.log(`[${shard.id}] Shard Disconnect.`);
    });

    shard.on('error', error => {
        util.log(`[${shard.id}] Shard Error:`, error);
    });

    shard.on('ready', () => {
        util.log(`[${shard.id}] Shard Ready.`);
    });

    shard.on('reconnecting', () => {
        util.log(`[${shard.id}] Shard Reconnecting.`);
    });

    shard.on('spawn', () => {
        util.log(`[${shard.id}] Shard Spawn.`);
    });

    shard.on('message', async message => {
        if (!message.id) return;
        try {
            const ctx = { database, manager, shard };
            const args = util.deserialize(message.args);
            const result = await util.evalfn(message.fn, ctx, ...args);
            shard.send({ id: message.id, result: util.serialize(result) });
        }
        catch (error) {
            util.log(`[${shard.id}] Shard Message:`, error);
            shard.send({ id: message.id, error: util.serialize(error) });
        }
    });
});

util.log('Launching shards...');
const shards = await manager.spawn();
const botTag = await shards.first().fetchClientValue('user.tag');
util.log(`Ready! Logged in as ${botTag}.`);
