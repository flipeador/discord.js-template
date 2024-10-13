import process from 'node:process';
import { Client, GatewayIntentBits } from 'discord.js';

import * as util from './lib/util.js';

const ROOT = import.meta.dirname;

class Bot {
    id = 0;
    ids = new Map();
    commands = new Map();

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages
            ]
        });

        this.client.bot = this;

        process.on('message', this.onMessage.bind(this));
    }

    /**
     * Processes messages sent from the parent process.
     */
    onMessage(message) {
        if (!message.id) return;
        const data = this.useId(message.id);
        'error' in message ?
        data?.reject?.(util.deserialize(message.error)) :
        data?.resolve?.(util.deserialize(message.result));
    }

    /**
     * Creates a unique temporary ID.
     */
    createId(data, timeout=600000) {
        const id = `${this.id++}`;
        this.ids.set(id, data);
        data.timer = setTimeout(
            () => {
                const data = this.ids.get(id);
                this.ids.delete(id) &&
                data?.reject?.(new Error('Timeout'));
            },
            timeout
        );
        return id;
    }

    /**
     * Consumes an ID and returns its associated data.
     */
    useId(id) {
        if (typeof(id) === 'object')
            id = id?.customId ?? id;
        const data = this.ids.get(id);
        this.ids.delete(id) &&
        clearTimeout(data.timer);
        return data;
    }

    /**
     * Sends a message to the parent process.
     */
    async send(data) {
        return new Promise((resolve, reject) => {
            data.id = this.createId({ resolve, reject });
            process.send(data);
        });
    }

    /**
     * Evaluates JavaScript code in the parent process.
     */
    async eval(fn, ...args) {
        return this.send({ fn: `${fn}`, args: util.serialize(args) });
    }

    async loadCommands() {
        const files = util.files(`${ROOT}/commands`, ['.js'], 1);
        for await (const file of files) {
            const command = await import(`file://${file}`);
            this.commands.set(command.data.name, command);
        }
    }

    async registerEvents() {
        const files = util.files(`${ROOT}/events`, ['.js']);
        for await (const file of files) {
            const event = await import(`file://${file}`);
            this.client[event.once ? 'once' : 'on'](
                event.name, event.execute
            );
        }
    }
}

const bot = new Bot();
await bot.registerEvents();
bot.client.login(process.env.TOKEN);
