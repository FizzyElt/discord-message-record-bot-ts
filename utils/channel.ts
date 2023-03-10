import {
  ApplicationCommandOptionType,
  CategoryChannel,
  ChannelType,
  Client,
  Channel,
  CommandInteraction,
  TextChannel,
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

export const getChannelByClient = (id: string) => (client: Client<true>) =>
  O.fromNullable(client.channels.cache.get(id));

export const getTextChannelsInfo = flow<
  [CategoryChannel],
  Array<{ id: string; name: string }>,
  Array<{ id: string; name: string }>
>(getCategoryTextChannels, R.map(pickChannelIdAndName));

export const getTextChannelInfo = flow<[TextChannel], { id: string; name: string }>(
  pickChannelIdAndName
);

const eqChannelByType = R.propEq('type');

export const isCategoryChannel = (channel: Channel): channel is CategoryChannel =>
  eqChannelByType(ChannelType.GuildCategory, channel);

export const isTextChannel = (channel: Channel): channel is TextChannel =>
  eqChannelByType(ChannelType.GuildText, channel);
