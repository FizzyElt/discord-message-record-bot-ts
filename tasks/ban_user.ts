import {
  CacheType,
  Client,
  CommandInteraction,
  EmojiIdentifierResolvable,
  Message,
  AwaitReactionsOptions,
  GuildMember,
} from 'discord.js';
import * as Option from 'fp-ts/Option';
import * as Task from 'fp-ts/Task';
import * as TaskOption from 'fp-ts/TaskOption';
import { pipe } from 'fp-ts/function';

import * as R from 'ramda';

import { format } from 'date-fns';

import { getCommandOptionString, getCommandOptionInt } from '../utils/channel';
import findUserByMembers from '../utils/find_user_by_members';
import isAdmin from '../utils/isAdmin';

const reactMsg = (emoji: EmojiIdentifierResolvable) => (msg: Message<boolean>) =>
  TaskOption.tryCatch(() => msg.react(emoji));

const awaitReactions = (options?: AwaitReactionsOptions) => (msg: Message<boolean>) =>
  TaskOption.tryCatch(() => msg.awaitReactions(options));

const timeoutMember = ({
  count,
  timeoutMins,
  msg,
  member,
}: {
  count: number;
  timeoutMins: number;
  msg: Message<boolean>;
  member: GuildMember;
}) =>
  pipe(
    TaskOption.tryCatch(() =>
      msg.reply(
        `恭喜獲得 **${count}** 票 **${
          member.nickname || member.user.username
        }** 禁言 ${timeoutMins} 分鐘`
      )
    ),
    TaskOption.apFirst(TaskOption.tryCatch(() => member.timeout(timeoutMins * 60 * 1000)))
  );

const votingFlow = ({
  member,
  interaction,
  mins,
}: {
  member: GuildMember;
  mins: number;
  interaction: CommandInteraction<CacheType>;
}) =>
  pipe(
    TaskOption.tryCatch(() =>
      interaction.reply({
        content: `是否禁言 **${
          member.nickname || member.user.username
        } ${mins}** 分鐘\n*3 分鐘後累積 5 票者禁言*`,
        fetchReply: true,
      })
    ),
    TaskOption.chainFirst(reactMsg('✅')),
    TaskOption.bindTo('replyMsg'),
    TaskOption.bind('collected', ({ replyMsg }) =>
      awaitReactions({
        filter: (reaction, user) => reaction.emoji.name === '✅' && !user.bot,
        time: 3 * 60 * 1000,
      })(replyMsg)
    ),
    TaskOption.chainFirst(({ collected, replyMsg }) => {
      const count = pipe(
        Option.fromNullable(collected.get('✅')?.count),
        Option.filter(R.gt(R.__, 0)),
        Option.map(R.dec),
        Option.getOrElse(() => 0)
      );

      if (count >= 5)
        return timeoutMember({ count: count, msg: replyMsg, timeoutMins: mins, member: member });

      return TaskOption.tryCatch(() =>
        replyMsg.reply(`**${count}** 票，**${member.nickname || member.user.username}** 逃過一劫`)
      );
    }),
    TaskOption.map(R.prop('replyMsg'))
  );

function banUser(client: Client<true>) {
  return (interaction: CommandInteraction<CacheType>) =>
    pipe(
      Option.of({
        userId: getCommandOptionString('mention_user')(interaction),
        mins: getCommandOptionInt('time')(interaction),
      }),
      Task.of,
      TaskOption.bind('member', ({ userId }) =>
        interaction.guild?.members
          ? findUserByMembers(userId)(interaction.guild.members)
          : TaskOption.none
      ),
      Task.chain(
        Option.match(
          () =>
            TaskOption.tryCatch(() =>
              interaction.reply({ content: '找不到使用者', fetchReply: true })
            ),
          ({ member, mins }) => {
            if (isAdmin(member))
              return TaskOption.tryCatch(() =>
                interaction.reply({ content: '你不可以 ban 管理員', fetchReply: true })
              );

            // is bot self
            if (R.equals(member.user.id, client.user.id))
              return TaskOption.tryCatch(() =>
                interaction.reply({ content: '你不可以 ban 我', fetchReply: true })
              );

            // member is disabled
            if (member.isCommunicationDisabled())
              return TaskOption.tryCatch(() =>
                interaction.reply({
                  content: `${
                    member.nickname || member.user.username
                  } 還在服刑\n出獄時間為 ${format(
                    member.communicationDisabledUntil,
                    'yyyy-MM-dd HH:mm'
                  )}`,
                  fetchReply: true,
                })
              );

            return votingFlow({ member, interaction, mins });
          }
        )
      )
    );
}

export default banUser;
