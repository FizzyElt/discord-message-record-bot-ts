import { Interaction, CacheType, Client, Awaitable } from 'discord.js';
import { pipe } from 'fp-ts/function';
import { commandOperation } from '../tasks/command_operation';
interface InteractionCreate {
  (client: Client<true>): (interaction: Interaction<CacheType>) => Awaitable<void>;
}

const interactionCreate: InteractionCreate = (client) => (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  commandOperation({ client, interaction })();
};

export default interactionCreate;
