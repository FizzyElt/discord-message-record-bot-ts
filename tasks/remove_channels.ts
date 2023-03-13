import {
  Client,
  Channel,
  ChannelType,
  CategoryChannel,
  TextChannel,
  CommandInteraction,
} from 'discord.js';
import * as Option from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';
import * as Task from 'fp-ts/Task';
import * as TaskOption from 'fp-ts/TaskOption';
import * as IOOption from 'fp-ts/IOOption';
import { pipe, flow, constant } from 'fp-ts/function';
import * as R from 'ramda';
import exclude_channels from '../store/exclude_channels';

import {
  getCategoryTextChannels,
  getCommandOptionString,
  getTextChannelInfo,
  isCategoryChannel,
  isTextChannel,
} from '../utils/channel';

import { ChannelStoreRef, removeChannel, removeChannels } from '../store/new_exclude_channels';

const includeChannels = (channelStoreRef: ChannelStoreRef) => (channel: Channel) => {
  if (isCategoryChannel(channel)) {
    return pipe(
      IO.of(channel),
      IO.chainFirst(
        flow(getCategoryTextChannels, R.map(R.prop('id')), removeChannels(channelStoreRef))
      ),
      IO.map((channel) => `已監聽 **${channel.name}** 下的所有文字頻道`)
    );
  }

  if (isTextChannel(channel)) {
    return pipe(
      IO.of(channel),
      IO.chainFirst(flow(getTextChannelInfo, R.prop('id'), removeChannel(channelStoreRef))),
      IO.map((channel) => `已監聽 **${channel.name}**`)
    );
  }

  return IO.of('不支援的頻道類型');
};

export default function (client: Client<true>, channelStoreRef: ChannelStoreRef) {
  return (interaction: CommandInteraction) =>
    pipe(
      Option.some(interaction),
      Option.map(getCommandOptionString('id')),
      Option.chain((idOrName) =>
        Option.fromNullable(
          client.channels.cache.find(
            // @ts-ignore types/ramda not defined "whereAny"
            R.whereAny({ id: R.equals(idOrName), name: R.equals(idOrName) })
          )
        )
      ),
      IO.of,
      IOOption.chain(flow(includeChannels(channelStoreRef), IOOption.fromIO)),
      IOOption.getOrElse(constant(IO.of('找不到頻道'))),
      Task.fromIO,
      Task.chain((msg) => TaskOption.tryCatch(() => interaction.reply(msg)))
    );
}
