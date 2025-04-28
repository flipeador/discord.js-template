import {
    User,
    GuildMember, // eslint-disable-line no-unused-vars
    ButtonInteraction, // eslint-disable-line no-unused-vars
    CommandInteraction, // eslint-disable-line no-unused-vars
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageComponentInteraction, // eslint-disable-line no-unused-vars
    InteractionCallbackResponse, // eslint-disable-line no-unused-vars
    Collection,
    PermissionFlagsBits
} from 'discord.js';

import * as util from '@lib/util.js';
import { UserError } from '@lib/error.js';
import { Throttle } from '@lib/throttle.js';
import { link, syncFilter } from '@lib/discord.js';

/**
 * Standard 52-card deck: 1-10, Jack, Queen, King.
 */
export class CardDeck52 {
    constructor() {
        this.deck = [
            '1♣', '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', '9♣', '10♣', 'J♣', 'Q♣', 'K♣', // clubs
            '1♦', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '8♦', '9♦', '10♦', 'J♦', 'Q♦', 'K♦', // diamonds
            '1♥', '2♥', '3♥', '4♥', '5♥', '6♥', '7♥', '8♥', '9♥', '10♥', 'J♥', 'Q♥', 'K♥', // hearts
            '1♠', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', '10♠', 'J♠', 'Q♠', 'K♠', // spades
        ];
    }

    /**
     * Choose cards and remove them from the deck.
     * @param {number} count The amount of cards to choose.
     * @returns {{name:string,value:number}[]}
     */
    withdraw(count, j = 11, q = 12, k = 13) {
        return Array.from({ length: count }, () => {
            const name = util.choise(this.deck, true);
            const name2 = util.replace(name, ['J', j], ['Q', q], ['K', k]);
            return { name, value: parseInt(name2, 10) };
        });
    }
}

export class Player {
    /** @type {User} */ user;

    /**
     * Create a Player instance.
     * @param {User|GuildMember|BaseInteraction} target
     * A user, a guild member, or a command interaction.
     * @param {Function|object} [data]
     * The data associated with the player.
     */
    constructor(target, data) {
        this.data = data;
        this.user = target.user ?? target;
    }

    /**
     * Get a string with the player's mention.
     */
    toString() {
        return `<@${this.user.id}>`;
    }
}

class PlayerManager extends Collection {
    index = 0; // current player index

    /**
     * Get the current player.
     * @returns {Player?}
     */
    get current() {
        return super.at(this.index);
    }

    /**
     * Get the other player in a two-player game.
     * @returns {Player?}
     */
    get other() {
        const index = this.index + 1;
        return super.at(index >= this.size ? 0 : index);
    }

    /**
     * Move to the next player.
     */
    next() {
        ++this.index;
        if (this.index >= this.size)
            this.index = 0;
    }

    /**
     * Check if the player exists.
     * @param {Player} player
     */
    has(player) {
        return super.has(player.user.id);
    }

    /**
     * Add or update a player.
     * @param {Player} player
     */
    set(player) {
        super.set(player.user.id, player);
        return this;
    }

    /**
     * Add a new player.
     * @param {Player} player
     */
    add(player) {
        return this.has(player) ? null : this.set(player);
    }

    /**
     * Update an existing player.
     * @param {Player} player
     */
    update(player) {
        return this.has(player) ? this.set(player) : null;
    }

    /**
     * Set the data for all players.
     */
    reset(data) {
        for (const player of super.values())
            player.data = typeof(data) === 'function' ? data() : data;
        return this;
    }

    /**
     * Delete a player.
     * @param {Player} player
     */
    delete(player) {
       return super.delete(player.user.id);
    }

    /**
     * Determines if all players have their data set.
     */
    ready() {
        return super.every(player => player.data);
    }

    /**
     * Get a string with mentions of all players.
     * @param {(player:Player)=>boolean} filter
     */
    toString(filter, separator=' ') {
        let array = [...super.values()];
        if (typeof(filter) === 'function')
            array = array.filter(filter);
        return array.join(separator);
    }
}

class Lobby {
    throttleUpdate = new Throttle(2500);

    /**
     * Create a Lobby instance.
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * Show the lobby and wait for users to join.
     */
    async run() {
        this.game.response = await this.game.interaction.reply({
            embeds: this.getEmbeds(),
            components: this.getComponents(),
            withResponse: true
        });

        // Wait for users to join the game.
        const filter = this.filter.bind(this);
        if (!await this.game.awaitMessageComponent({ filter, time: 10 * 60 * 1000 }))
            this.game.players.clear(); // remove all players if the time expires

        // At this point any pending update must be cancelled.
        this.throttleUpdate.clear(); // no need for more updates

        if (!this.game.challenger)
            await this.abort('The challenger has abandoned the game.');

        // Add the bot if there are not enough players and it is allowed to play.
        if (this.game.players.size < this.game.minPlayers && this.game.allowBot)
            this.game.players.add(new Player(this.game.botUser));

        // If there are still not enough players to start the game.
        if (this.game.players.size < this.game.minPlayers)
            await this.abort('The game could not start due to lack of players.');
    }

    /**
     * Update the content of the lobby message.
     */
    async update(update) {
        if (!update) return;
        return this.throttleUpdate.execute(() => { // update every 2.5 seconds
            return this.game.interaction.editReply({ embeds: this.getEmbeds() });
        });
    }

    /**
     * Abort the game.
     * @param {string} reason
     */
    async abort(reason) {
        await this.game.interaction.editReply({
            embeds: this.getEmbeds(`🛑⠀**The game has been aborted.**\n${reason}`),
            components: [] // remove all components
        });
        throw null;
    }

    /**
     * Message component filter.
     * @param {ButtonInteraction} interaction
     * @returns {Promise<boolean>}
     * Whether to stop collecting component interactions.
     */
    async filter(interaction) {
        const player = new Player(interaction);
        if (interaction.customId === 'start')
            return player.user.id === this.game.challenger.user.id;
        else if (interaction.customId === 'join')
            this.update(this.game.players.add(player));
        else if (interaction.customId === 'leave')
            if (this.game.players.delete(player))
                this.update(this.game.players.size);
        return (
            !this.game.challenger || // abort
            this.game.players.size === this.game.maxPlayers
        );
    }

    /**
     * Get the embeds for the lobby message.
     */
    getEmbeds(description) {
        const range = `${this.game.minPlayers}-${this.game.maxPlayers}`;

        return [
            new EmbedBuilder({
                title: this.game.name,
                description: description || `**Players:**⠀${this.game.players}`,
                footer: description ? null : {
                    text: `Player count:⠀${this.game.players.size} of ${range}`
                }
            })
        ];
    }

    /**
     * Get the components for the lobby message.
     */
    getComponents() {
        // If the bot is not already in the game, subtract one from the
        // minimum number of players so that the bot can occupy a place.
        const minus = this.game.bot ? 0 : 1;
        const minPlayers = this.game.minPlayers - minus;
        const startDisabled = this.game.players.size < minPlayers;

        return [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Start')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(startDisabled)
                    .setCustomId('start'),
                new ButtonBuilder()
                    .setLabel('Join')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId('join'),
                new ButtonBuilder()
                    .setLabel('Leave')
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('leave')
            )
        ];
    }
}

/**
 * Base class for creating games.
 */
export class Game {
    /** @type {Set<Game>} */
    static games = new Set();

    name = '';
    allowBot = true;
    minPlayers = 2; // 2-26
    maxPlayers = 26; // 2-26

    // https://github.com/discordjs/discord.js/pull/10636
    /** @type {InteractionCallbackResponse} */ response; // ≥14.17.0

    /**
     * Create a Game instance.
     * @param {CommandInteraction} interaction
     */
    constructor(interaction) {
        this.interaction = interaction;

        this.players = new PlayerManager();
        this.players.add(new Player(this.interaction));
    }

    /**
     * Start the game.
     */
    async run() {
        for (const game of Game.games) {
            if (game.interaction.user.id === this.interaction.user.id) {
                const oneGame = link('one game', game.response?.resource?.message?.url);
                throw new UserError(`You can not start more than ${oneGame} at a time.`);
            }
        }

        Game.games.add(this);
        return this.main().finally(() => Game.games.delete(this));
    }

    /**
     * Initialize the game and send the initial message.
     * @param {Function} fn
     * A function that returns the content of the initial message.
     */
    async initialize(fn) {
        // Disallow games with ephemeral responses.
        // If the game is invoked in a guild where the app is not installed,
        // and the `Use External Apps` permission is disabled for the invoker.
        if (
            !this.interaction.appPermissions.has(PermissionFlagsBits.ViewChannel) &&
            !this.interaction.memberPermissions.has(PermissionFlagsBits.UseExternalApps)
        ) throw new UserError('Games with ephemeral responses are not allowed.');

        // Retrieve all players from the chat command parameters.
        for (let n = 2; n <= this.maxPlayers; ++n) {
            const user = this.interaction.options.getUser(`p${n}`);
            if (user instanceof User) {
                if (user.bot && (!this.allowBot || user.id !== this.botUser.id))
                    throw new UserError(`User ${user} is a bot and can't participate in the game.`);
                if (!this.players.add(new Player(user)))
                    throw new UserError(`User ${user} has been specified more than once.`);
            }
        }

        if (this.players.size >= this.minPlayers)
            this.response = await this.interaction.reply({ ...fn(this), withResponse: true });
        // Show the lobby if there are not enough players to start the game.
        else {
            await new Lobby(this).run(); // wait for users to join the game
            await this.interaction.editReply(fn(this)); // reuse the lobby message
        }
    }

    /**
     * Collects messages that passes the filter.
     *
     * Apps without the `MESSAGE_CONTENT` intent require the bot to be mentioned.
     * @param {object} options
     * @param {number} [options.time]
     * How long to run the collector for, in milliseconds.
     * @param {number} [options.max=1]
     * The maximum amount of messages to collect.
     * @param {Function} [options.filter=this.filter]
     * The async filter function applied to this collector. \
     * The filter is executed sequentially to avoid race conditions.
     * @returns {Promise<Collection<string,Message>?>}
     * A falsy value if the time has expired.
     * @see https://discord.com/developers/docs/events/gateway#message-content-intent
     * @see https://discord.js.org/docs/packages/discord.js/main/TextChannel:Class#awaitMessages
     */
    async awaitMessages(options) {
        options.max ??= 1;
        options.errors ??= ['time'];
        options.filter ??= this.filter;
        options.filter = syncFilter(options.filter.bind(this));
        return this.interaction.channel.awaitMessages(options).catch(() => null);
    }

    /**
     * Collects a single component interaction that passes the filter.
     * @param {object} options
     * @param {number} [options.time]
     * How long to run the collector for, in milliseconds.
     * @param {Function} [options.filter=this.filter]
     * The async filter function applied to this collector. \
     * The filter is executed sequentially to avoid race conditions.
     * @returns {Promise<MessageComponentInteraction?>}
     * A falsy value if the time has expired.
     * @see https://discord.js.org/docs/packages/discord.js/main/Message:Class#awaitMessageComponent
     */
    async awaitMessageComponent(options) {
        options.filter ??= this.filter;
        options.filter = syncFilter(options.filter.bind(this));
        return this.response.resource.message.awaitMessageComponent(options).catch(() => null);
    }

    /**
     * Get the ClientUser object for the bot.
     */
    get botUser() {
        return this.interaction.client.user;
    }

    /**
     * Get the Player object for the bot, if it exists.
     * @returns {Player?}
     */
    get bot() {
        return this.players.get(this.botUser.id);
    }

    /**
     * Get the Player object for the challenger, if it exists.
     * @returns {Player?}
     */
    get challenger() {
        return this.players.get(this.interaction.user.id);
    }

    /**
     * Get the opponents as a string of mentions.
     */
    get opponents() {
        return this.players.toString(player => player.user.id !== this.interaction.user.id);
    }
}
