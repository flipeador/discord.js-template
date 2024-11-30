# Discord.js Template

A basic Discord bot application template using [Discord.js][djs] v14.

The template uses the [Discord.js][djs] built-in `ShardingManager` to run shards in [separate processes][process]. \
Although [sharding][sharding] is only required at 2500 guilds, doing so in advance should not be a problem.

The [native `node:sqlite` module][sqlite] of [Node.js v22.5.0][v2250] is used for the database. \
Currently, the module is loaded but the database is not used.

# Instructions

Create a Discord bot application, see [Discord.js Guide - Setting up a bot application][setup].

> 🤖 Generate an invite link for your application.
>
> 1. Navigate to [Discord Developers - Applications][apps].
> 2. Scroll down and select your app, copy the **Application ID**.
> 3. Replace `000000000000000000` with your app ID in the URLs below.
>
> Add the application to your private test server:
> ```
> https://discord.com/oauth2/authorize?client_id=000000000000000000&permissions=2147485696&integration_type=0&scope=bot+applications.commands
> ```
>
> Add the application to your user account to use it anywhere:
> ```
> https://discord.com/oauth2/authorize?client_id=000000000000000000&integration_type=1&scope=applications.commands
> ```

Before starting up the bot, you will need to install and configure a few things.

Install [pnpm][pnpm], then run the following command in the [Terminal][terminal] to install the latest version of [Node.js][node]:

```sh
pnpm env use latest -g
```

Download or [clone][clone] the repository, open the root directory with [Visual Studio Code][code].

Open the [VS Code Terminal][code-terminal], and run the following command to install all required dependencies:

```sh
pnpm install

# Optionally, update all dependencies to their latest versions.
pnpm up --latest
```

Install the [VS Code ESLint extension][code-eslint], it helps you find and fix problems with your JavaScript code. \
Once the extension is installed, the following command can be used to check for problems in all files:

```sh
node --run lint
```

Open the [VS Code Command Palette][code-palette] with <kbd><kbd>CTRL</kbd>+<kbd>SHIFT</kbd>+<kbd>P</kbd></kbd>,
and select `Developer: Reload Window`.

Rename [`.sample.env`](.sample.env) to `.env`, and configure the required fields:
- Set the bot **token**, **application id** and **owner id**.
- Set a **test server id** in which the bot is in for testing purposes.

Run the following commands to register application commands and start the bot:

```ps1
# Register all commands in the test server.
node --run reg -- bulk ALL TEST

# Start the bot and log in to Discord.
node --run bot
```

The bot should be up and running by now, check the information displayed in the console.

Continue reading [Application Commands](#application-commands) to learn how to create and register app commands.

## Application Commands

Commands can be scoped either globally or to a specific server.

- **Global commands** are available in all of the servers where your app is installed, and in DMs if the bot shares a mutual server with the user. Register global commands when they're ready for public use.
- **Guild commands** are only available in the servers you explicitly add them, making them useful for features available only to a subset of servers. Register guild commands for quick testing, as they are updated instantly.

```ps1
# Register all global commands.
# The "ALL" keyword references all commands in 'src/commands'.
node --run reg -- create ALL

# Register all commands in the test server.
# The "TEST" keyword references "TEST_GUILD_ID" in the '.env' file.
node --run reg -- create ALL TEST

# Delete the "rolldice" command in a specific server.
node --run reg -- delete rolldice 1234567890123456789

# Multiple commands can be specified by separating them with a comma.
# The 'src/commands/log.json' file stores a log with all the commands.
# Use the "bulk" command instead of "create" to bulk-overwrite all commands.
# Registering a command with an already-used name will update the existing command.
```

You must create the [application commands][appcmds] in [`src/commands`](src/commands) before [registering them][regcmds].

The following table specifies all available application commands that serve as examples:

| Command | Type | Scope | Tags |
| --- | --- | --- | --- |
| [`/eval`](src/commands/chat/eval.js) | Chat input | Server | `owner` `modal` |
| [`/rolldice`](src/commands/chat/rolldice.js) | Chat input | Global | |
| [`Get avatar`](src/commands/user/avatar.js) | User context menu | Global | `embed` |

> [!TIP]
> To close all connections gracefully and terminate the main process:
> - Invoke the [`/eval`](src/commands/chat/eval.js) slash command from within the Discord client.
> - Once the [modal][modals] or pop-up form appears, provide the following code:
> ```js
> (interaction) => {
>     // Evaluates code in 'src/bot.js'.
>     interaction.client.bot.eval(async ({ manager }) => {
>         // Evaluates code in 'src/index.js'.
>         await manager.broadcastEval(client => client.destroy());
>         process.exit(); // terminate the process (src/index.js)
>     });
> }
> ```

## License

This project is licensed under the **GNU General Public License v3.0**.
See the [license file](LICENSE) for details.

<!-- Reference Links -->
[node]: https://nodejs.org
[sqlite]: https://nodejs.org/api/sqlite.html
[process]: https://nodejs.org/api/child_process.html#class-childprocess
[v2250]: https://nodejs.org/en/blog/release/v22.5.0
[pnpm]: https://pnpm.io/installation

[terminal]: https://docs.microsoft.com/windows/terminal

[code]: https://code.visualstudio.com
[code-terminal]: https://code.visualstudio.com/docs/terminal/basics
[code-palette]: https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette
[code-eslint]: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint

[apps]: https://discord.com/developers/applications
[regcmds]: https://discord.com/developers/docs/tutorials/upgrading-to-application-commands#registering-commands
[appcmds]: https://discord.com/developers/docs/interactions/application-commands

[djs]: https://discord.js.org
[sharding]: https://discordjs.guide/sharding
[setup]: https://discordjs.guide/preparations/setting-up-a-bot-application.html
[modals]: https://discordjs.guide/interactions/modals.html

[clone]: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
