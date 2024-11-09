import '@/lib/setup/initialize';

import { ApplicationCommandRegistries, container, LogLevel, RegisterBehavior, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';

const client = new SapphireClient({
    logger: { level: LogLevel.Info },
    loadDefaultErrorListeners: false,
    loadScheduledTaskErrorListeners: false,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [ Partials.Message, Partials.Channel, Partials.Reaction, Partials.User ],
    tasks: { bull: { connection: {
        db: 1,
        // I know this is bad, I don't care.
        host: process.env.REDIS_HOST.split(':')[0],
        port: parseInt(process.env.REDIS_HOST.split(":")[1]),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD
    }}}
});

await client.login();

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
