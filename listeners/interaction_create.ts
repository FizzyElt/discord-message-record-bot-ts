import { Interaction, CacheType, Client, Awaitable } from 'discord.js';
import { commandOperation } from '../tasks/command_operation';
import * as TaskOption from 'fp-ts/TaskOption';
import { pipe, identity } from 'fp-ts/function';
function interactionCreate(client: Client<true>) {
  return (interaction: Interaction<CacheType>): Awaitable<void> => {
    if (!interaction.isCommand()) return;

    pipe(
      commandOperation({ client, interaction }),
      TaskOption.match(() => console.error('reply error'), identity)
    )();
  };
}

export default interactionCreate;
