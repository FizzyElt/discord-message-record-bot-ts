import {
  SlashCommandBuilder,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
} from '@discordjs/builders';

import { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

const createNumberChoice = (
  name: string,
  value: number
): APIApplicationCommandOptionChoice<number> => ({
  name: name,
  value: value,
});

const minsChoices: Array<[string, number]> = [
  ['10 minutes', 10],
  ['30 minutes', 30],
  ['1 hour', 60],
  ['1 day', 60 * 24],
  ['1 week', 60 * 24 * 7],
];

export enum CommandName {
  add_channels = 'add_channels',
  remove_channels = 'remove_channels',
  channel_list = 'channel_list',
  ban_user = 'ban_user',
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

  new SlashCommandBuilder()
    .setName(CommandName.ban_user)
    .setDescription('ban user')
    .addStringOption(
      new SlashCommandStringOption()
        .setName('mention_user')
        .setDescription('mention user')
        .setMaxLength(150)
        .setRequired(true)
    )
    .addIntegerOption(
      new SlashCommandIntegerOption()
        .setName('time')
        .setDescription('time(mins)')
        .setChoices(...minsChoices.map(([name, value]) => createNumberChoice(name, value)))
        .setRequired(true)
    ),
];
