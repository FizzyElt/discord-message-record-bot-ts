import {
  CacheType,
  Client,
  CommandInteraction,
  EmojiIdentifierResolvable,
  Message,
  AwaitReactionsOptions,
  GuildMemberManager,
} from 'discord.js';
import * as Option from 'fp-ts/Option';
import * as Task from 'fp-ts/Task';
import * as TaskOption from 'fp-ts/TaskOption';
import { flow, pipe } from 'fp-ts/function';

import * as R from 'ramda';

import user_black_list from '../store/user_black_list';

import { getCommandOptionString, getCommandOptionInt } from '../utils/channel';

const reactMsg = (emoji: EmojiIdentifierResolvable) => (msg: Message<boolean>) =>
  TaskOption.tryCatch(() => msg.react(emoji));

const awaitReactions = (options?: AwaitReactionsOptions) => (msg: Message<boolean>) =>
  TaskOption.tryCatch(() => msg.awaitReactions(options));

const findUser = (idOrTag: string) => (members: GuildMemberManager) =>
  pipe(
    TaskOption.tryCatch(() => members.fetch()),
    TaskOption.chain((members) =>
      TaskOption.fromNullable(
        members.find((member) => member.user.tag.includes(idOrTag) || member.user.id === idOrTag)
      )
    ),
    TaskOption.map((member) => member)
  );

function banUser(client: Client<true>) {
  return (interaction: CommandInteraction<CacheType>) =>
    pipe(
      Option.of({
        userId: getCommandOptionString('user_id')(interaction),
        mins: getCommandOptionInt('time')(interaction),
      }),
      Task.of,
      TaskOption.bind('member', ({ userId }) =>
        interaction.guild?.members ? findUser(userId)(interaction.guild.members) : TaskOption.none
      ),
      Task.chain(
        Option.match(
          () =>
            TaskOption.tryCatch(() =>
              interaction.reply({ content: '找不到使用者', fetchReply: true })
            ),
          flow(
            TaskOption.of,
            TaskOption.bind('replyMsg', ({ member, mins }) =>
              pipe(
                TaskOption.tryCatch(() =>
                  interaction.reply({
                    content: `是否禁言 **${member.nickname || member.user.username} ${mins}** 分鐘`,
                    fetchReply: true,
                  })
                ),
                TaskOption.chainFirst(reactMsg('✅'))
              )
            ),
            TaskOption.bind(
              'collected',
              flow(
                R.prop('replyMsg'),
                awaitReactions({
                  filter: (reaction, user) => reaction.emoji.name === '✅' && !user.bot,
                  time: 30_000,
                })
              )
            ),
            TaskOption.chainFirst(({ collected, replyMsg, member, mins }) => {
              if (collected.size >= 5)
                return pipe(
                  TaskOption.tryCatch(() =>
                    replyMsg.reply(
                      `**${member.nickname || member.user.username}** 禁言 ${mins} 分鐘`
                    )
                  ),
                  TaskOption.chainFirst(() =>
                    TaskOption.fromIO(user_black_list.addUser(member.id, mins))
                  )
                );

              return TaskOption.tryCatch(() =>
                replyMsg.reply(`**${member.nickname || member.user.username}** 逃過一劫`)
              );
            }),
            TaskOption.map(R.prop('replyMsg'))
          )
        )
      )
    );
}

export default banUser;
