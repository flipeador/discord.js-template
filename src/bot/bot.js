import process from 'node:process';
import * as util from '@lib/util.js';
import { Client, GatewayIntentBits } from 'discord.js';

const ROOT = import.meta.dirname;
const EVENTS = `${ROOT}/events/*.js`;
const COMMANDS = `${ROOT}/commands/**/*.js`;

const $TIMER = Symbol();

class Bot {
    #id = 0;
    #ids = new Map();
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

        process.on('message', this.#onMessage.bind(this));
    }

    /**
     * Processes messages sent from the parent process.
     * @private
     */
    #onMessage(message) {
        message = util.deserialize(message);
        if (message === undefined) return;
        const data = this.useId(message.id);
        'error' in message ?
        data?.reject?.(message.error) :
        data?.resolve?.(message.result);
    }

    /**
     * Creates a unique temporary ID.
     * @param {object} data
     * The data to associate with the ID.
     * @param {string} [data.id]
     * If not specified, a new unique ID is generated.
     * @param {string} [data.module]
     * The name of a file used to handle component and modal events. \
     * Search for `module?.endsWith` to find all files that check this key.
     * @param {number} [timeout=600000]
     * The number of milliseconds to wait before the ID expires.
     */
    createId(data, timeout=600000) {
        data.id ??= `${this.#id++}`;
        this.#ids.set(data.id, data);
        data[$TIMER] = setTimeout(
            () => {
                delete data[$TIMER];
                this.#ids.delete(data.id);
                data.reject?.(new Error('Timeout'));
            },
            timeout
        );
        return data.id;
    }

    /**
     * Consumes an ID and returns its associated data.
     */
    useId(id) {
        if (typeof(id) === 'object')
            id = id?.customId ?? id;
        const data = this.#ids.get(id);
        if (this.#ids.delete(id)) {
            clearTimeout(data[$TIMER]);
            delete data[$TIMER];
        }
        return data;
    }

    /**
     * Sends a message to the parent process.
     */
    async send(data) {
        return new Promise((resolve, reject) => {
            data.id = this.createId({ resolve, reject });
            process.send(util.serialize(data));
        });
    }

    /**
     * Evaluates JavaScript code in the parent process.
     */
    async eval(fn, ...args) {
        return this.send({ __command: 'eval', fn: `${fn}`, args });
    }

    async loadCommands() {
        for await (const file of util.fsp.glob(COMMANDS)) {
            const command = await import(`file://${file}`);
            this.commands.set(command.data.name, command);
        }
    }

    async registerEvents() {
        for await (const file of util.fsp.glob(EVENTS)) {
            const event = await import(`file://${file}`);
            const method = event.once ? 'once' : 'on';
            this.client[method](event.name, event.execute);
        }
    }
}

const bot = new Bot();
await bot.registerEvents();
bot.client.login(process.env.APP_TOKEN);
