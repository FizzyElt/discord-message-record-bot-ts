import {
  Client,
  Channel,
  ChannelType,
  CategoryChannel,
  TextChannel,
  CommandInteraction,
  InteractionResponse,
  PermissionFlagsBits,
  CacheType,
  BaseInteraction,
} from 'discord.js';

function isAdmin(interaction: BaseInteraction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || false;
}

export default isAdmin;
