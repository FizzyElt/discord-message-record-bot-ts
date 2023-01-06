import { Interaction, CacheType, Client, Awaitable } from 'discord.js';

interface InteractionCreate {
  (client: Client<true>): (interaction: Interaction<CacheType>) => Awaitable<void>;
}

const interactionCreate: InteractionCreate = (client) => (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  interaction.reply('hello world');
};

export default interactionCreate;
