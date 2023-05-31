import type { Client, CommandInteraction, InteractionResponse, Message } from 'discord.js';
import { pipe } from 'fp-ts/function';
import * as TO from 'fp-ts/TaskOption';
import * as IORef from 'fp-ts/IORef';
import * as R from 'ramda';
import { CommandName } from '../slash_command/command';

import { ChannelStoreRef } from '../store/exclude_channels';

import addChannels from './add_channels';
import removeChannels from './remove_channels';
import listChannels from './list_channels';
import banUser from './ban_user';
import banUserPlus from './ban_user_plus';

function getOperationByCommand(
  client: Client<true>,
  votingStoreRef: IORef.IORef<Set<string>>,
  channelStoreRef: ChannelStoreRef
) {
  const eqCommandName = R.propEq('commandName');
  return R.cond<
    [CommandInteraction],
    TO.TaskOption<InteractionResponse<boolean> | Message<boolean>>
  >([
    [eqCommandName(CommandName.add_channels), addChannels(client, channelStoreRef)],
    [eqCommandName(CommandName.remove_channels), removeChannels(client, channelStoreRef)],
    [eqCommandName(CommandName.channel_list), listChannels(channelStoreRef)],
    [eqCommandName(CommandName.ban_user), banUser(client, votingStoreRef)],
    [eqCommandName(CommandName.ban_user_plus), banUserPlus(client, votingStoreRef)],
    [R.T, (interaction) => TO.tryCatch(() => interaction.reply('不支援的指令'))],
  ]);
}

interface CommandOperationPrams {
  client: Client<true>;
  interaction: CommandInteraction;
  votingStoreRef: IORef.IORef<Set<string>>;
  channelStoreRef: ChannelStoreRef;
}

export function commandOperation(params: CommandOperationPrams) {
  return pipe(
    params.interaction,
    getOperationByCommand(params.client, params.votingStoreRef, params.channelStoreRef)
  );
}
