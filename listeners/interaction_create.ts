import { Interaction, CacheType, Client, Awaitable } from 'discord.js';
import { commandOperation } from '../tasks/command_operation';

function interactionCreate(client: Client<true>) {
  return (interaction: Interaction<CacheType>): Awaitable<void> => {
    if (!interaction.isCommand()) return;

    commandOperation({ client, interaction })();
  };
}

export default interactionCreate;
