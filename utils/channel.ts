import {
  ApplicationCommandOptionType,
  CategoryChannel,
  ChannelType,
  CommandInteraction,
} from 'discord.js';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'ramda';

export const getCategoryTextChannels = (channel: CategoryChannel) =>
  channel.children.cache
    .filter(flow(R.propEq('type', ChannelType.GuildVoice), R.not))
    .map(R.identity);

export const pickChannelIdAndName = R.pick(['id', 'name']);

export const getCommandOptionOfType = R.curry(
  (type: ApplicationCommandOptionType, optionName: string, interaction: CommandInteraction) =>
    pipe(
      interaction.options.data.find(R.propEq('name', optionName)),
      O.fromNullable,
      O.filter(R.propEq('type', type))
    )
);

export const getCommandOptionString = (optionName: string) =>
  flow(
    getCommandOptionOfType(ApplicationCommandOptionType.String)(optionName),
    O.filter(R.propIs(String, 'value')),
    O.map(R.prop('value')),
    O.getOrElse(R.always(''))
  );

export const getCommandOptionInt = (optionName: string) =>
  flow(
    getCommandOptionOfType(ApplicationCommandOptionType.Integer)(optionName),
    O.filter(R.propIs(Number, 'value')),
    O.map(R.prop('value')),
    O.getOrElse(R.always(0))
  );
