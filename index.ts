import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

import * as IO from 'fp-ts/IO';
import * as Task from 'fp-ts/Task';
import * as IORef from 'fp-ts/IORef';
import * as Set from 'fp-ts/Set';
import * as Map from 'fp-ts/Map';
import { pipe } from 'fp-ts/function';

import { ChannelStore } from './store/exclude_channels';

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

pipe(
  IO.Do,
  IO.bind('client', () => IO.of(client)),
  IO.bind('channelStoreRef', () =>
    IORef.newIORef<ChannelStore>(
      Map.singleton(
        process.env.BOT_SENDING_CHANNEL_ID as string,
        process.env.BOT_SENDING_CHANNEL_NAME as string
      )
    )
  ),
  IO.bind('votingStoreRef', () => IORef.newIORef<Set<string>>(Set.empty)),
  Task.fromIO,
  Task.chain(({ client, votingStoreRef, channelStoreRef }) => {
    client.on('ready', readyListener);

    client.on('messageCreate', messageCreate(client, channelStoreRef));

    client.on('messageUpdate', messageUpdate(client, channelStoreRef));

    client.on('messageDelete', messageDelete(client, channelStoreRef));

    client.on('interactionCreate', interactionCreate(client, votingStoreRef, channelStoreRef));

    client.on('guildMemberAdd', guildMemberAdd(client));

    client.on('guildMemberRemove', guildMemberRemove(client));

    return Task.of(client.login(process.env.TOKEN));
  })
)();
