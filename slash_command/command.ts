import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders';

export enum CommandName {
  add_channels = 'add_channels',
  remove_channels = 'remove_channels',
  channel_list = 'channel_list',
  ban_user = 'ban_user',
  unban_user = 'unban_user',
}

export const commands = [
  new SlashCommandBuilder()
    .setName(CommandName.add_channels)
    .setDescription('add exclusive channels')
    .addStringOption(
      new SlashCommandStringOption()
        .setName('id')
        .setDescription('channel_id or category_id')
        .setMaxLength(150)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName(CommandName.remove_channels)
    .setDescription('remove exclusive channels')
    .addStringOption(
      new SlashCommandStringOption()
        .setName('id')
        .setDescription('channel_id or category_id')
        .setMaxLength(150)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName(CommandName.channel_list)
    .setDescription('list exclusive channels'),

  new SlashCommandBuilder().setName(CommandName.ban_user).setDescription('ban user'),
  new SlashCommandBuilder().setName(CommandName.unban_user).setDescription('unban user'),
];
