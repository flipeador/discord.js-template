import process from 'node:process';
import * as util from '@lib/util.js';

const ROOT = import.meta.dirname;
const COMMANDS_GLOB = `${ROOT}/commands/**/*.js`;
const COMMANDS_LOG_FILE = `${ROOT}/commands/log.json`;

const APP_ID = process.env.APP_ID;
const APP_TOKEN = process.env.APP_TOKEN;
const APP_TEST_GUILD_ID = process.env.APP_TEST_GUILD_ID;

const $action = process.argv[2];
const $commands = process.argv[3]?.split?.(',') ?? [];
const $guild = process.argv[4] === 'TEST' ? APP_TEST_GUILD_ID : (process.argv[4] || '');

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
            body: body === undefined ? body : JSON.stringify(body)
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
        this.data = await util.load(COMMANDS_LOG_FILE, {});

        if (!this.data['']) {
            util.log('Fetching global commands...');
            this.data[''] = await query('commands');
        }

        if (!this.data[APP_TEST_GUILD_ID]) {
            util.log('Fetching test guild commands...');
            this.data[APP_TEST_GUILD_ID] = await query(`guilds/${APP_TEST_GUILD_ID}/commands`);
        }

        if ($guild && !this.data[$guild]) {
            util.log('Fetching guild commands...');
            this.data[$guild] = await query(`guilds/${$guild}/commands`);
        }

        return this;
    }

    async dump() {
        return util.dump(COMMANDS_LOG_FILE, this.data, 2);
    }

    find(name) {
        return this.data[$guild]?.find(c => c.name === name);
    }

    add(command) {
        this.data[$guild] ??= [];
        this.remove($guild, command);
        this.data[$guild].push(command);
    }

    replace(commands) {
        this.data[$guild] = commands;
    }

    remove(command) {
        this.data[$guild] = this.data[$guild].filter(c => c.id !== command.id);
    }

    filter(commandNames) {
        return this.data[$guild].filter(c => commandNames.includes(c.name));
    }
}

let commands = [];
const log = await new Log().load();
const path = $guild ? `guilds/${$guild}/commands` : 'commands';

if ($action === 'delete') {
    commands = log.filter($commands);
} else {
    for await (const file of util.fsp.glob(COMMANDS_GLOB)) {
        const module = await import(`file://${file}`);

        if (
            ($guild || module.global === true) &&
            ($commands.includes('ALL') || $commands.includes(module.data.name))
        ) {
            module.data.type ??= 1;
            module.data.id = log.find(module.data.name)?.id;
            commands.push(module.data);
        }
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
        log.add(await response.json());
    }
}

// Delete guild/global application command.
// https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command
// https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command
if ($action === 'delete') {
    for (const command of commands) {
        await api(`DELETE ${path}/${command.id}`);
        util.log('Deleted command:', command.name);
        log.remove(command);
    }
}

// Bulk overwrite guild/global application commands.
// https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-guild-application-commands
// https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
if ($action === 'bulk') {
    const response = await api(`PUT ${path}`, commands);
    const list = commands.map(c => c.name).join(', ');
    util.log('Bulk created commands:', list);
    log.replace(await response.json());
}

await log.dump();
