import {
  Client,
  Channel,
  ChannelType,
  CategoryChannel,
  TextChannel,
  CommandInteraction,
  InteractionResponse,
  PermissionFlagsBits,
  CacheType,
} from 'discord.js';
import { pipe, flow } from 'fp-ts/function';
import { fromCompare } from 'fp-ts/Ord';
import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import * as TO from 'fp-ts/TaskOption';
import * as Map from 'fp-ts/Map';
import * as IO from 'fp-ts/IO';
import * as IOOption from 'fp-ts/IOOption';
import * as R from 'ramda';
import exclude_channels from '../store/exclude_channels';
import user_black_list from '../store/user_black_list';
import {
  getCategoryTextChannels,
  getCommandOptionString,
  getCommandOptionInt,
  pickChannelIdAndName,
} from '../utils/channel';
import { CommandName } from '../slash_command/command';

function isAdmin(interaction: CommandInteraction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) || false;
}

const notSupportChannelType = R.always('不支援的頻道類型');
const notFoundChannel = R.always('找不到頻道');

const getTextChannelsInfo = flow<
  [CategoryChannel],
  Array<{ id: string; name: string }>,
  Array<{ id: string; name: string }>
>(getCategoryTextChannels, R.map(pickChannelIdAndName));

const getTextChannelInfo = flow<[TextChannel], { id: string; name: string }>(pickChannelIdAndName);

function addChannels(client: Client<true>) {
  return (interaction: CommandInteraction) =>
    pipe(
      O.some(interaction),
      O.map(getCommandOptionString('id')),
      O.chain((idOrName) =>
        O.fromNullable(
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
            [R.T, () => notSupportChannelType],
          ]),
          IO.map(O.some)
        )
      ),
      IOOption.getOrElse(() => notFoundChannel)
    );
}

function removeChannels(client: Client<true>) {
  return (interaction: CommandInteraction) =>
    pipe(
      O.some(interaction),
      O.map(getCommandOptionString('id')),
      O.chain((idOrName) =>
        O.fromNullable(
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
                  IO.chainFirst(
                    flow(
                      getCategoryTextChannels,
                      R.map(R.prop('id')),
                      exclude_channels.removeChannels
                    )
                  ),
                  IO.map((channel) => `已監聽 **${channel.name}** 下的所有文字頻道`)
                ),
            ],
            [
              R.propEq('type', ChannelType.GuildText),
              (channel) =>
                pipe(
                  IO.of(channel as TextChannel),
                  IO.chainFirst(
                    flow(getTextChannelInfo, R.prop('id'), exclude_channels.removeChannel)
                  ),
                  IO.map((channel) => `已監聽 **${channel.name}**`)
                ),
            ],
            [R.T, () => notSupportChannelType],
          ]),
          IO.map(O.some)
        )
      ),
      IOOption.getOrElse(() => notFoundChannel)
    );
}

function listChannels() {
  return pipe(
    exclude_channels.getChannelMap(),
    IO.map(
      flow(
        Map.toArray(fromCompare(R.always(0))),
        R.map(([id, name]) => `(${id}) ${name}`),
        R.join('\n'),
        (names) => `目前排除的頻道有：\n${names}`
      )
    )
  );
}

function banUser(client: Client<true>) {
  return (interaction: CommandInteraction) =>
    pipe(
      isAdmin(interaction) ? O.none : O.some('不是管理員還敢 ban 人阿'),
      IO.of,
      IOOption.alt(() => {
        const userId = getCommandOptionString('user_id')(interaction);
        const mins = getCommandOptionInt('time')(interaction);

        return pipe(
          client.users.cache.find(R.propEq('id', userId)),
          IOOption.fromNullable,
          IOOption.chainFirst((user) => IOOption.fromIO(user_black_list.addUser(user.id, mins))),
          IOOption.map((user) => `${user.username} 禁言 ${mins} 分鐘`)
        );
      }),
      IOOption.getOrElse(() => R.always('找不到使用者'))
    );
}

function unbanUser(client: Client<true>) {
  return (interaction: CommandInteraction) =>
    pipe(
      isAdmin(interaction) ? O.none : O.some('你不是管理員，你沒有權限解 ban'),
      IO.of,
      IOOption.alt(() =>
        pipe(
          getCommandOptionString('user_id')(interaction),
          (userId) => client.users.cache.find(R.propEq('id', userId)),
          IOOption.fromNullable,
          IOOption.chain((user) =>
            pipe(
              IO.Do,
              IO.bind('user', () => IO.of(user)),
              IO.bind('isReleased', ({ user }) => user_black_list.removeUser(user.id)),
              IO.map(({ user, isReleased }) =>
                isReleased ? `${user.username} 重穫自由` : '此人沒有被禁言'
              ),
              IOOption.fromIO
            )
          )
        )
      ),
      IOOption.getOrElse(() => R.always('找不到使用者'))
    );
}

function getOperationByCommand(
  client: Client<true>
): (interaction: CommandInteraction<CacheType>) => IO.IO<string> {
  const eqCommandName = R.propEq('commandName');
  return R.cond([
    [eqCommandName(CommandName.add_channels), addChannels(client)],
    [eqCommandName(CommandName.remove_channels), removeChannels(client)],
    [eqCommandName(CommandName.channel_list), listChannels],
    [eqCommandName(CommandName.ban_user), banUser(client)],
    [eqCommandName(CommandName.unban_user), unbanUser(client)],
    [R.T, () => R.always('不支援的指令')],
  ]);
}

interface CommandOperationPrams {
  client: Client<true>;
  interaction: CommandInteraction;
}

export function commandOperation(
  params: CommandOperationPrams
): TO.TaskOption<InteractionResponse> {
  return pipe(
    params.interaction,
    getOperationByCommand(params.client),
    T.fromIO,
    T.chain((replyMsg) => TO.tryCatch(() => params.interaction.reply(replyMsg)))
  );
}
