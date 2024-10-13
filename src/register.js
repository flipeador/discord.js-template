import process from 'node:process';
import * as util from './lib/util.js';

const ROOT = import.meta.dirname;
const CMDS_DIR = `${ROOT}/commands`;
const LOG_FILE = `${ROOT}/commands/log.json`;

const APP_ID = process.env.APP_ID;
const APP_TOKEN = process.env.TOKEN;
const TEST_GUILD = process.env.TEST_GUILD_ID;

const $action = process.argv[2];
const $commands = process.argv[3]?.split(',') ?? [];
const $guild = process.argv[4] === 'TEST' ? TEST_GUILD : (process.argv[4] || '');

async function api(url, body) {
    const [method, path] = url.split(' ');

    const response = await fetch(
        `https://discord.com/api/v10/applications/${APP_ID}/${path}`,
        {
            method,
            headers: {
                Authorization: `Bot ${APP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        }
    );

    if (!response.ok)
        throw await response.json();

    return response;
}

async function query(url) {
    const response = await api(`GET ${url}`);
    return (await response.json()) || [];
}

class Log {
    async load() {
        this.data = await util.load(LOG_FILE, {});

        if (!this.data['']) {
            util.log('Fetching global commands...');
            this.data[''] = await query('commands');
        }

        if (!this.data[TEST_GUILD]) {
            util.log('Fetching test server commands...');
            this.data[TEST_GUILD] = await query(`guilds/${TEST_GUILD}/commands`);
        }

        if ($guild && !this.data[$guild]) {
            util.log('Fetching server commands...');
            this.data[$guild] = await query(`guilds/${$guild}/commands`);
        }

        return this;
    }

    async dump() {
        await util.dump(LOG_FILE, this.data, 2);
    }

    getId(guildId, command) {
        return this.data[guildId]?.find(cmd =>
            cmd.type === command.type &&
            cmd.name === command.name
        )?.id;
    }

    add(guildId, command) {
        this.data[guildId] ??= [];
        this.remove(guildId, command);
        this.data[guildId].push(command);
    }

    replace(guildId, commands) {
        this.data[guildId] = commands;
    }

    remove(guildId, command) {
        this.data[guildId] = this.data[guildId].filter(c => c.id !== command.id);
    }
}

const commands = [];
const log = await new Log().load();
const files = util.files(CMDS_DIR, ['.js'], 1);
const path = $guild ? `guilds/${$guild}/commands` : 'commands';

for await (const file of files) {
    const path = `${file}`.replace(ROOT, '.');
    const module = await import(path);

    if (
        ($guild || module.global === true) &&
        ($commands.includes('ALL') || $commands.includes(module.data.name))
    ) {
        module.data.type ??= 1;
        module.data.id = log.getId($guild, module.data);
        commands.push(module.data);
    }
}

if (commands.length === 0) {
    util.log('No commands found.');
    await log.dump();
    process.exit();
}

// Create guild/global application command.
// https://discord.com/developers/docs/interactions/application-commands#create-guild-application-command
// https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
if ($action === 'create') {
    for (const command of commands) {
        const response = await api(`POST ${path}`, command);
        util.log('Created command:', command.name);
        log.add($guild, await response.json());
    }
}

// Delete guild/global application command.
// https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command
// https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command
if ($action === 'delete') {
    for (const command of commands) {
        await api(`DELETE ${path}/${command.id}`);
        util.log('Deleted command:', command.name);
        log.remove($guild, command);
    }
}

// Bulk overwrite guild/global application commands.
// https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-guild-application-commands
// https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
if ($action === 'bulk') {
    const response = await api(`PUT ${path}`, commands);
    const list = commands.map(c => c.name).join(', ');
    util.log('Bulk created commands:', list);
    log.replace($guild, await response.json());
}

await log.dump();
