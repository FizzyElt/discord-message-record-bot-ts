import {
  Client,
  ChannelType,
  CategoryChannel,
  TextChannel,
  CommandInteraction,
  InteractionResponse,
  PermissionFlagsBits,
} from 'discord.js';
import { pipe, flow } from 'fp-ts/function';
import { fromCompare } from 'fp-ts/Ord';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import * as Map from 'fp-ts/Map';
import * as R from 'ramda';
import exclude_channels from '../store/exclude_channels';
import {
  getCategoryTextChannels,
  getCommandOptionString,
  getCommandOptionInt,
  pickChannelIdAndName,
} from '../utils/channel';
import { CommandName } from '../slash_command/command';

const isAdmin = (interaction: CommandInteraction) =>
  interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || false;

const notSupportChannelType = R.always('不支援的頻道類型');
const notFoundChannel = R.always('找不到頻道');

const getTextChannelsInfo = flow<
  [CategoryChannel],
  Array<{ id: string; name: string }>,
  Array<{ id: string; name: string }>
>(getCategoryTextChannels, R.map(pickChannelIdAndName));

const getTextChannelInfo = flow<[TextChannel], { id: string; name: string }>(pickChannelIdAndName);

const addChannels = (client: Client<true>) => (interaction: CommandInteraction) =>
  pipe(
    O.some(interaction),
    O.map(getCommandOptionString('id')),
    O.chain((idOrName) =>
      O.fromNullable(client.channels.cache.find(R.whereEq({ id: idOrName, name: idOrName })))
    ),
    O.map(
      R.cond([
        [
          R.propEq('type', ChannelType.GuildCategory),
          (channel) =>
            pipe(
              channel as CategoryChannel,
              R.tap(flow(getTextChannelsInfo, exclude_channels.addChannels)),
              (channel) => `已排除 **${channel.name}** 下的所有文字頻道`
            ),
        ],
        [
          R.propEq('type', ChannelType.GuildText),
          (channel) =>
            pipe(
              channel as TextChannel,
              R.tap(flow(getTextChannelInfo, exclude_channels.addChannel)),
              (channel) => `已排除 **${channel.name}**`
            ),
        ],
        [R.T, notSupportChannelType],
      ])
    ),
    O.getOrElse(notFoundChannel)
  );

const removeChannels = (client: Client<true>) => (interaction: CommandInteraction) =>
  pipe(
    O.some(interaction),
    O.map(getCommandOptionString('id')),
    O.chain((idOrName) =>
      O.fromNullable(client.channels.cache.find(R.whereEq({ id: idOrName, name: idOrName })))
    ),
    O.map(
      R.cond([
        [
          R.propEq('type', ChannelType.GuildCategory),
          (channel) =>
            pipe(
              channel as CategoryChannel,
              R.tap(
                flow(getCategoryTextChannels, R.map(R.prop('id')), exclude_channels.removeChannels)
              ),
              (channel) => `已排除 **${channel.name}** 下的所有文字頻道`
            ),
        ],
        [
          R.propEq('type', ChannelType.GuildText),
          (channel) =>
            pipe(
              channel as TextChannel,
              R.tap(flow(getTextChannelInfo, R.prop('id'), exclude_channels.removeChannel)),
              (channel) => `已排除 **${channel.name}**`
            ),
        ],
        [R.T, notSupportChannelType],
      ])
    ),
    O.getOrElse(notFoundChannel)
  );

const listChannels = () =>
  pipe(
    exclude_channels.getChannelMap(),
    Map.toArray(fromCompare(R.always(0))),
    R.map(([id, name]) => `(${id}) ${name}`),
    R.join('\n'),
    (names) => `目前排除的頻道有：\n${names}`
  );

const banUser = (client: Client<true>) => (interaction: CommandInteraction) =>
  pipe(
    isAdmin(interaction) ? O.none : O.some('不是管理員還敢 ban 人阿'),
    O.alt(() => {
      const userId = getCommandOptionString('user_id')(interaction);
      const mins = getCommandOptionInt('time')(interaction);

      return pipe(
        client.users.cache.find(R.propEq('id', userId)),
        O.fromNullable,
        O.map(
          R.tap((user) => {}) // TODO: add user to blackList
        ),
        O.map((user) => `${user.username} 禁言 ${mins} 分鐘`)
      );
    }),
    O.getOrElse(R.always('找不到使用者'))
  );

const unbanUser = (client: Client<true>) => (interaction: CommandInteraction) =>
  pipe(
    isAdmin(interaction) ? O.none : O.some('你不是管理員，你沒有權限解 ban'),
    O.alt(() =>
      pipe(
        getCommandOptionString('user_id')(interaction),
        (userId) => client.users.cache.find(R.propEq('id', userId)),
        O.fromNullable,
        O.map((user) => (false ? `${user.username} 重穫自由` : '此人沒有被禁言')) // TODO: remove user from blackList
      )
    ),
    O.getOrElse(R.always('找不到使用者'))
  );

const getOperationByCommand = (client: Client<true>) => {
  const eqCommandName = R.propEq('commandName');
  return R.cond([
    [eqCommandName(CommandName.add_channels), addChannels(client)],
    [eqCommandName(CommandName.remove_channels), removeChannels(client)],
    [eqCommandName(CommandName.channel_list), listChannels],
    [eqCommandName(CommandName.ban_user), banUser(client)],
    [eqCommandName(CommandName.unban_user), unbanUser(client)],
    [R.T, R.always('不支援的指令')],
  ]);
};

interface CommandOperation {
  (params: {
    client: Client<true>;
    interaction: CommandInteraction;
  }): TO.TaskOption<InteractionResponse>;
}

export const commandOperation: CommandOperation = (params) => {
  return pipe(params.interaction, getOperationByCommand(params.client), (replyMsg) =>
    TO.tryCatch(() => params.interaction.reply(replyMsg))
  );
};
