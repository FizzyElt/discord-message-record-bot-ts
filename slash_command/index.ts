import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import dotenv from 'dotenv';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { commands } from './command';
dotenv.config();

const token = process.env.TOKEN || '';
const clientId = process.env.CLIENT_ID || '';
const guildId = process.env.GUILD_ID || '';

const rest = new REST({ version: '10' }).setToken(token);

const pushCommands = (params: { clientId: string; guildId: string }) => {
  return TE.tryCatch(
    () =>
      rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands.map((command) => command.toJSON()),
      }),
    (err) => err
  );
};

pipe(
  pushCommands({ clientId, guildId }),
  TE.match(
    (err) => console.log('command push fail', err),
    (res) => console.log('command push success', res)
  )
)();
