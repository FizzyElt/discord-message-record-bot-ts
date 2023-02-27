import type {
  Client,
  CommandInteraction,
  InteractionResponse,
  Message,
  CacheType,
} from 'discord.js';
import { pipe } from 'fp-ts/function';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import { CommandName } from '../slash_command/command';

import addChannels from './add_channels';
import removeChannels from './remove_channels';
import listChannels from './list_channels';
import banUser from './ban_user';
import unbanUser from './unban_user';

function getOperationByCommand(client: Client<true>) {
  const eqCommandName = R.propEq('commandName');
  return R.cond<
    [CommandInteraction],
    TO.TaskOption<InteractionResponse<boolean> | Message<boolean>>
  >([
    [eqCommandName(CommandName.add_channels), addChannels(client)],
    [eqCommandName(CommandName.remove_channels), removeChannels(client)],
    [eqCommandName(CommandName.channel_list), listChannels],
    [eqCommandName(CommandName.ban_user), banUser(client)],
    [eqCommandName(CommandName.unban_user), unbanUser(client)],
    [R.T, (interaction) => TO.tryCatch(() => interaction.reply('不支援的指令'))],
  ]);
}

interface CommandOperationPrams {
  client: Client<true>;
  interaction: CommandInteraction;
}

export function commandOperation(params: CommandOperationPrams) {
  return pipe(params.interaction, getOperationByCommand(params.client));
}
