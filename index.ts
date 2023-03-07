import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

import {
  readyListener,
  messageDelete,
  messageUpdate,
  messageCreate,
  interactionCreate,
  guildMemberAdd,
  guildMemberRemove,
} from './listeners';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.on('ready', readyListener);

client.on('messageCreate', messageCreate(client));

client.on('messageUpdate', messageUpdate(client));

client.on('messageDelete', messageDelete(client));

client.on('interactionCreate', interactionCreate(client));

client.on('guildMemberAdd', guildMemberAdd(client));

client.on('guildMemberRemove', guildMemberRemove(client));

client.login(process.env.TOKEN);
