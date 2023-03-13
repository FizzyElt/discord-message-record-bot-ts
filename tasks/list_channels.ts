import { CommandInteraction, CacheType } from 'discord.js';
import { pipe, flow } from 'fp-ts/function';
import { fromCompare } from 'fp-ts/Ord';
import * as IO from 'fp-ts/IO';
import * as Task from 'fp-ts/Task';
import * as TaskOption from 'fp-ts/TaskOption';
import * as Map from 'fp-ts/Map';
import * as R from 'ramda';
import exclude_channels from '../store/exclude_channels';

import { ChannelStoreRef, readChannelStore } from '../store/new_exclude_channels';

function listChannels(channelStoreRef: ChannelStoreRef) {
  return (interaction: CommandInteraction<CacheType>) =>
    pipe(
      readChannelStore(channelStoreRef),
      IO.map(
        flow(
          Map.collect(fromCompare(R.always(0)))((id, name) => `(${id}) ${name}`),
          R.join('\n'),
          (names) => `目前排除的頻道有：\n${names}`
        )
      ),
      Task.fromIO,
      Task.chain((msg) => TaskOption.tryCatch(() => interaction.reply(msg)))
    );
}

export default listChannels;
