import {
  Client,
  CommandInteraction,
  GuildMember,
  InteractionResponse,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} from 'discord.js';
import { pipe, flow } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';

const isAdmin = (interaction: CommandInteraction) =>
  interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || false;

const addChannels = (params: { client: Client<true>; interaction: CommandInteraction }) => {
  //   const chanelId = pipe(
  //     params.interaction,
  //     (interaction) => interaction.options.data.find(R.propEq('name', 'id')),
  //     O.fromNullable,
  //     O.filter(R.propEq('type', ApplicationCommandOptionType.String)),
  //     O.chain(flow(R.prop('value'), O.fromNullable, O.filter(R.is(String)))),
  //     O.getOrElse(() => ''),
  //     (idOrName) =>
  //       params.client.channels.cache.find(
  //         R.where({ id: R.equals(idOrName), name: R.equals(idOrName) })
  //       ),
  //     O.fromNullable,
  //     O.chainFirst(()=>)
  //   );
};

interface CommandOperation {
  (params: {
    client: Client<true>;
    interaction: CommandInteraction;
  }): TO.TaskOption<InteractionResponse>;
}

const commandOperation: CommandOperation = (params) => {
  return TO.tryCatch(() => params.interaction.reply('123'));
};
