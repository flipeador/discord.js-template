# Discord.js Template

A basic Discord bot application template using [Node.js ≥24][v2340][^1] and [Discord.js][djs] v14.

The template uses the [Discord.js][djs] built-in `ShardingManager` to run shards in [separate processes][node-ipc]. \
Although [sharding][sharding] is only required at 2500 guilds, doing so in advance should not be a problem.

The [native `node:sqlite` module][node-sqlite] added in [Node.js 22.5][v2250] is used for the [SQLite][sqlite] database. \
Currently, the module is loaded but the database is not used.

# Instructions

Create a Discord bot application ([Discord.js Guide - Setting up a bot application][setup]).

> 🤖 Generate an invite link for your application.
>
> 1. Navigate to [Discord Developers - Applications][apps].
> 2. Scroll down and select your app. Copy the **Application ID**.
> 3. Go to `⚙️ Installation` and select both [installation contexts][insctx].
> 4. Replace `000000000000000000` with your app ID in the URLs below.
>
> Add the bot application to your private test server:
> ```
> https://discord.com/oauth2/authorize?client_id=000000000000000000&permissions=2147485696&integration_type=0&scope=bot+applications.commands
> ```
>
> Add the bot application to your user account to use it anywhere:
> ```
> https://discord.com/oauth2/authorize?client_id=000000000000000000&integration_type=1&scope=applications.commands
> ```
> Adding the bot application to your user account allows its use even on servers where it is not installed. \
> The bot's messages will be ephemeral if the invoker has the `Use External Apps` permission disabled. [^2]

Before starting up the bot, you will need to install and configure a few things.

Install [pnpm][pnpm], then run the following command in the [Terminal][terminal] to install [Node.js][node]:

```sh
# Install the latest version of NodeJS.
pnpm env use latest --global

# Once NodeJS is installed, you can close the terminal.
# We will use the VS Code integrated terminal from now on.
```

[Clone][clone] this repository to your local computer, open the root directory with [Visual Studio Code][code]. \
Alternatively, you can [create a new repository using this template][template], then [clone][clone] your own repository.

Run the following command in the [VS Code Terminal][code-terminal] to install all required dependencies:

```sh
# Change the current directory.
cd src

# Install all dependencies for the project.
pnpm install

# Optionally, update all dependencies to their latest versions.
pnpm update --latest
```

Install the [VS Code ESLint extension][code-eslint], it helps you find and fix problems with your JavaScript code. \
Open the [VS Code Command Palette][code-palette] with <kbd><kbd>CTRL</kbd>+<kbd>SHIFT</kbd>+<kbd>P</kbd></kbd>,
and select `Developer: Reload Window`.

<details>
<summary>Expand to see how to run ESLint from the terminal. (OPTIONAL)</summary>

```sh
# Check for problems in all files.
node --run lint

# Tool for inspecting ESLint configs.
node --run lint:ci
```

</details>

Rename [`.sample.env`](src/.sample.env) to `.env`, and configure the required fields:
- Set the bot **token**, **application id** and **owner id**.
- Set a **test server id** in which the bot is in for testing purposes.

Run the following commands to register application commands and start the bot:

```ps1
# Register all application commands in the test server.
node --run reg -- bulk ALL TEST

# Start the bot application and log in to Discord.
node --run bot
```

The bot should be up and running by now, check the information displayed in the terminal.

Continue reading [Application Commands](#application-commands) to learn how to create and register app commands.

## Application Commands

Application commands can be scoped either globally or to a specific server.

- **Global commands** are available in all of the servers where your app is installed, and in DMs if the bot shares a mutual server with the user. Register global commands when they're ready for public use.
- **Guild commands** are only available in the servers you explicitly add them, making them useful for features available only to a subset of servers. Register guild commands for quick testing, as they are updated instantly.

```ps1
# Register all global commands.
# The "ALL" keyword references all commands in 'src/bot/commands'.
node --run reg -- create ALL

# Register all commands in the test server.
# The "TEST" keyword references "APP_TEST_GUILD_ID" in the '.env' file.
node --run reg -- create ALL TEST

# Delete the "rolldice" command in a specific server.
node --run reg -- delete rolldice 1234567890123456789

# Multiple commands can be specified by separating them with a comma.
# The 'src/bot/commands/log.json' file stores a log with all the commands.
# Use the "bulk" action instead of "create" to bulk-overwrite all commands.
# Registering a command with an already-used name will update the existing command.
```

You must create the [application commands][appcmds] in [`src/bot/commands`](src/bot/commands) before [registering them][regcmds].

The following table specifies all available application commands that serve as examples:

| Command | Type | Scope | Integration Types | Tags |
| --- | --- | --- | --- | --- |
| [`/eval`](src/bot/commands/chat/eval.js) | Chat input | Server | `user` `guild` | `owner` `modal` |
| [`/rps`](src/bot/commands/chat/rps.js) | Chat input | Global | `user` `guild` | `fun` `game` |
| [`/guess`](src/bot/commands/chat/guess.js) | Chat input | Global | `guild` | `fun` `game` [`CV2`][compv2] |
| [`/blackjack`](src/bot/commands/chat/blackjack.js) | Chat input | Global | `user` `guild` | `fun` `game` |
| [`/rolldice`](src/bot/commands/chat/rolldice.js) | Chat input | Global | `user` `guild` | `fun` [`CV2`][compv2] |
| [`Get avatar`](src/bot/commands/user/avatar.js) | User context menu | Global | `user` `guild` | `util` `embed` |

The integration types defines the contexts where the command is available, only for globally-scoped commands:

| Integration Type | Description |
| --- | --- |
| [`user`][userctx] | The command is visible to users who have installed the application on their account. |
| [`guild`][servctx] (Server) | The command is visible to all members of the server where the application is installed. |

> [!NOTE]
> Ephemeral messages are only visible to the user who invoked the interaction.
>
> ```js
> import { MessageFlags } from 'discord.js';
> export async function execute(interaction) {
>     const response = await interaction.reply({
>         content: 'Initial reply',
>         flags: MessageFlags.Ephemeral,
>         withResponse: true
>     });
>
>     // You can use `<CommandInteraction>.editReply` to edit the initial ephemeral reply.
>     await interaction.editReply({ content: 'The new content for the initial reply!!' });
>
>     // But `<InteractionCallbackResponse>.resource` is `undefined` for ephemeral replies.
>     await response.resource.message.edit({ content: 'This line will throw an error!!' });
> }
> ```

> [!TIP]
> Disallow a command to run in a channel where all messages are forced ephemeral:
> ```js
> import { UserError } from '@lib/error.js';
> import { PermissionFlagsBits } from 'discord.js';
> export async function execute(interaction) {
>     // If the command is invoked in a guild where the app is not installed,
>     // and the "Use External Apps" permission is disabled for the invoker.
>     if (
>         !interaction.appPermissions.has(PermissionFlagsBits.ViewChannel) &&
>         !interaction.memberPermissions.has(PermissionFlagsBits.UseExternalApps)
>     ) throw new UserError('This command cannot be invoked on this channel.');
> }
> ```

> [!TIP]
> To close all connections gracefully and terminate the main process:
> - Invoke the [`/eval`](src/bot/commands/chat/eval.js) slash command from within the Discord client.
> - Once the [modal][modals] or pop-up form appears, submit the following code:
> ```js
> (interaction) => {
>     // This code is evaluated in 'src/bot/bot.js'.
>     interaction.client.bot.eval(async ({ manager }) => {
>         // This code is evaluated in 'src/bot/index.js'.
>         await manager.broadcastEval(client => client.destroy());
>         process.exit(); // terminate the process (src/bot/index.js)
>     });
> }
> ```

## License

This project is licensed under the **GNU General Public License v3.0**.
See the [license file](LICENSE) for details.

<!-- Footnotes -->
[^1]: [Node.js ≥24][v2340] is required for `Error.isError` and `Promise.try`.
[^2]: [YouTube — PSA: Discord added a New Raid and Scamming Method... (@NoTextToSpeech)](https://youtu.be/6vjG34uyPz0)

<!-- Reference Links -->
[node]: https://nodejs.org
[node-sqlite]: https://nodejs.org/api/sqlite.html
[node-ipc]: https://nodejs.org/api/child_process.html#class-childprocess
[v2250]: https://nodejs.org/en/blog/release/v22.5.0
[v2340]: https://nodejs.org/en/blog/release/v24.0.0

[pnpm]: https://pnpm.io/installation
[sqlite]: https://sqlite.org

[terminal]: https://learn.microsoft.com/en-us/windows/terminal

[code]: https://code.visualstudio.com
[code-terminal]: https://code.visualstudio.com/docs/terminal/basics
[code-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[code-eslint]: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint

[apps]: https://discord.com/developers/applications
[insctx]: https://discord.com/developers/docs/resources/application#installation-context
[compv2]: https://discord.com/developers/docs/change-log/2025-04-22-components-v2 "Components v2"
[compref]: https://discord.com/developers/docs/components/reference "Component Reference"
[userctx]: https://discord.com/developers/docs/resources/application#user-context
[servctx]: https://discord.com/developers/docs/resources/application#server-context
[regcmds]: https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
[appcmds]: https://discord.com/developers/docs/interactions/application-commands

[djs]: https://discord.js.org
[sharding]: https://discordjs.guide/sharding
[setup]: https://discordjs.guide/preparations/setting-up-a-bot-application.html
[modals]: https://discordjs.guide/interactions/modals.html

[clone]: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[template]: https://github.com/new?template_name=discord.js-template&template_owner=flipeador
