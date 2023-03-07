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

import { getCommandOptionString, getTextChannelInfo, getTextChannelsInfo } from '../utils/channel';

import exclude_channels from '../store/exclude_channels';

function addChannels(client: Client<true>) {
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
      IOOption.chain(
        flow(
          R.cond<[Channel], IO.IO<string>>([
            [
              R.propEq('type', ChannelType.GuildCategory),
              (channel) =>
                pipe(
                  IO.of(channel as CategoryChannel),
                  IO.chainFirst(flow(getTextChannelsInfo, exclude_channels.addChannels)),
                  IO.map((channel) => `已排除 **${channel.name}** 下的所有文字頻道`)
                ),
            ],
            [
              R.propEq('type', ChannelType.GuildText),
              (channel) =>
                pipe(
                  IO.of(channel as TextChannel),
                  IO.chainFirst(flow(getTextChannelInfo, exclude_channels.addChannel)),
                  IO.map((channel) => `已排除 **${channel.name}**`)
                ),
            ],
            [R.T, constant(IO.of('不支援的頻道類型'))],
          ]),
          IOOption.fromIO
        )
      ),
      IOOption.getOrElse(constant(IO.of('找不到頻道'))),
      Task.fromIO,
      Task.chain((msg) => TaskOption.tryCatch(() => interaction.reply(msg)))
    );
}

export default addChannels;
