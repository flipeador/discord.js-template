import process from 'node:process';
import { version, ShardingManager } from 'discord.js';

import * as util from '@lib/util.js';
import { database } from './database/database.js';

util.log(`pid ${process.pid} | node.js ${process.version} | discord.js ${version}`);

const manager = new ShardingManager(
    './bot/bot.js',
    {
        mode: 'process',
        execArgv: [
            '--expose-gc',
            '--trace-warnings',
            '--max-old-space-size=4096',
            '--import', './register-hooks.js'
        ],
        token: process.env.APP_TOKEN
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
        message = util.deserialize(message);
        if (message === undefined) return;

        if (message.__command === 'eval') {
            const { id, fn, args } = message;
            try {
                const ctx = { database, manager, shard };
                const result = await util.evalfn(fn, ctx, ...args);
                shard.send(util.serialize({ id, result }));
            }
            catch (error) {
                shard.send(util.serialize({ id, error }));
                util.log(`[${shard.id}] Shard Message:`, error);
            }
        }
    });
});

util.log('Launching shards...');
const shards = await manager.spawn();
const botTag = await shards.first().fetchClientValue('user.tag');
util.log(`Ready! Logged in as ${botTag}`);
