import { Interaction, CacheType, Client, Awaitable } from 'discord.js';
import { commandOperation } from '../tasks/command_operation';
import * as TaskOption from 'fp-ts/TaskOption';
import { pipe, identity } from 'fp-ts/function';
import * as IORef from 'fp-ts/IORef';
import { ChannelStoreRef } from '../store/new_exclude_channels';

function interactionCreate(
  client: Client<true>,
  votingStoreRef: IORef.IORef<Set<string>>,
  channelStoreRef: ChannelStoreRef
) {
  return (interaction: Interaction<CacheType>): Awaitable<void> => {
    if (!interaction.isCommand()) return;

    pipe(
      commandOperation({ client, interaction, votingStoreRef, channelStoreRef }),
      TaskOption.match(() => console.error('reply error'), identity)
    )();
  };
}

export default interactionCreate;
