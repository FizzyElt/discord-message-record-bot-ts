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
import * as IORef from 'fp-ts/IORef';
import { pipe } from 'fp-ts/function';

import * as R from 'ramda';

import { formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { addNewVoting, removeVoting, isUserVoting } from '../store/voting_store';
import { getCommandOptionString } from '../utils/channel';
import findUserByMembers from '../utils/find_user_by_members';
import isAdmin from '../utils/isAdmin';

import { findTimeoutInfo, TimeoutInfo, minute } from '../utils/voteChoice';
import dotenv from 'dotenv';

dotenv.config();

const reactMsg = (emoji: EmojiIdentifierResolvable) => (msg: Message<boolean>) =>
  TaskOption.tryCatch(() => msg.react(emoji));

const awaitReactions = (options?: AwaitReactionsOptions) => (msg: Message<boolean>) =>
  TaskOption.tryCatch(() => msg.awaitReactions(options));

const timeoutMember = ({
  count,
  timeoutInfo,
  msg,
  member,
}: {
  count: number;
  timeoutInfo: TimeoutInfo;
  msg: Message<boolean>;
  member: GuildMember;
}) =>
  pipe(
    TaskOption.tryCatch(() =>
      msg.reply(
        `恭喜獲得 **${count}/${timeoutInfo.voteThreshold}** 票 **${
          member.nickname || member.user.username
        }** 禁言 ${timeoutInfo.name}`
      )
    ),
    TaskOption.apFirst(TaskOption.tryCatch(() => member.timeout(timeoutInfo.time * 1000)))
  );

const votingFlow = ({
  member,
  interaction,
  timeoutInfo,
  votingStoreRef,
}: {
  member: GuildMember;
  timeoutInfo: TimeoutInfo;
  interaction: CommandInteraction<CacheType>;
  votingStoreRef: IORef.IORef<Set<string>>;
}) =>
  pipe(
    TaskOption.tryCatch(() =>
      interaction.reply({
        content: `是否禁言 **${member.nickname || member.user.username} ** ${timeoutInfo.name}\n*${
          timeoutInfo.votingMinutes
        } 分鐘後累積 ${timeoutInfo.voteThreshold} 票者禁言*`,
        fetchReply: true,
      })
    ),
    TaskOption.tap(reactMsg('✅')),
    TaskOption.tapIO(() => addNewVoting(member.user.id)(votingStoreRef)),
    TaskOption.bindTo('replyMsg'),
    TaskOption.bind('collected', ({ replyMsg }) =>
      awaitReactions({
        filter: (reaction, user) => reaction.emoji.name === '✅' && !user.bot,
        time: timeoutInfo.votingMinutes * minute * 1000,
      })(replyMsg)
    ),
    TaskOption.tap(({ collected, replyMsg }) => {
      // member is disabled
      if (member.isCommunicationDisabled())
        return TaskOption.tryCatch(() =>
          replyMsg.reply({
            content: `${
              member.nickname || member.user.username
            } 還在服刑\n剩餘時間 ${formatDistanceToNow(
              member.communicationDisabledUntil
            )}\n出獄時間 ${formatInTimeZone(
              member.communicationDisabledUntil,
              process.env.TIMEZONE || 'Asia/Taipei',
              'yyyy-MM-dd HH:mm'
            )}`,
          })
        );

      const count = pipe(
        Option.fromNullable(collected.get('✅')?.count),
        Option.filter(R.gt(R.__, 0)),
        Option.map(R.dec),
        Option.getOrElse(() => 0)
      );

      if (count >= timeoutInfo.voteThreshold)
        return timeoutMember({ count: count, msg: replyMsg, timeoutInfo, member: member });

      return TaskOption.tryCatch(() =>
        replyMsg.reply(`**${count}** 票，**${member.nickname || member.user.username}** 逃過一劫`)
      );
    }),
    TaskOption.tapIO(() => removeVoting(member.user.id)(votingStoreRef)),
    TaskOption.map(R.prop('replyMsg'))
  );

function banUser(client: Client<true>, votingStoreRef: IORef.IORef<Set<string>>) {
  return (interaction: CommandInteraction<CacheType>) =>
    pipe(
      Option.of({
        userId: getCommandOptionString('mention_user')(interaction),
      }),
      Option.apS('timeoutInfo', pipe(getCommandOptionString('time')(interaction), findTimeoutInfo)),
      Task.of,
      TaskOption.bind('member', ({ userId }) =>
        interaction.guild?.members
          ? findUserByMembers(userId)(interaction.guild.members)
          : TaskOption.none
      ),
      Task.flatMap(
        Option.match(
          () =>
            TaskOption.tryCatch(() =>
              interaction.reply({ content: '找不到使用者', fetchReply: true })
            ),
          ({ member, timeoutInfo }) => {
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
                  content: `**${
                    member.nickname || member.user.username
                  }** 還在服刑\n剩餘時間 ${formatDistanceToNow(
                    member.communicationDisabledUntil
                  )}\n出獄時間 ${formatInTimeZone(
                    member.communicationDisabledUntil,
                    process.env.TIMEZONE || 'Asia/Taipei',
                    'yyyy-MM-dd HH:mm'
                  )}`,
                  fetchReply: true,
                })
              );

            if (isUserVoting(member.user.id)(votingStoreRef)())
              return TaskOption.tryCatch(() =>
                interaction.reply({
                  content: `**${
                    member.nickname || member.user.username
                  }** 正在審判中\n請等待審判結束後重新發起投票`,
                  fetchReply: true,
                })
              );

            return votingFlow({ member, interaction, timeoutInfo, votingStoreRef });
          }
        )
      )
    );
}

export default banUser;
