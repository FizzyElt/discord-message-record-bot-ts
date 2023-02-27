import { CacheType, Client, CommandInteraction } from 'discord.js';
import * as Option from 'fp-ts/Option';
import * as TaskOption from 'fp-ts/TaskOption';
import { pipe } from 'fp-ts/function';

import * as R from 'ramda';

import user_black_list from '../store/user_black_list';

import { getCommandOptionString, getCommandOptionInt } from '../utils/channel';

function banUser(client: Client<true>) {
  return (interaction: CommandInteraction<CacheType>) =>
    pipe(
      Option.of({
        userId: getCommandOptionString('user_id')(interaction),
        mins: getCommandOptionInt('time')(interaction),
      }),
      Option.bind('user', ({ userId }) =>
        Option.fromNullable(client.users.cache.find(R.propEq('id', userId)))
      ),
      Option.match(
        () =>
          TaskOption.tryCatch(() =>
            interaction.reply({ content: '找不到使用者', fetchReply: true })
          ),
        (params) =>
          pipe(
            TaskOption.of(params),
            TaskOption.bind('replyMsg', ({ user, mins }) =>
              pipe(
                TaskOption.tryCatch(() =>
                  interaction.reply({
                    content: `是否禁言 ${user.username} ${mins} 分鐘`,
                    fetchReply: true,
                  })
                ),
                TaskOption.chainFirst((replyMsg) => TaskOption.tryCatch(() => replyMsg.react('✅')))
              )
            ),
            TaskOption.bind('collected', ({ replyMsg }) =>
              TaskOption.tryCatch(() =>
                replyMsg.awaitReactions({
                  filter: (reaction, user) => reaction.emoji.name === '✅' && !user.bot,
                  time: 30_000,
                })
              )
            ),
            TaskOption.chainFirst(({ collected, replyMsg, user, mins }) => {
              if (collected.size >= 5) {
                return pipe(
                  TaskOption.tryCatch(() => replyMsg.reply(`${user.username} 禁言 ${mins} 分鐘`)),
                  TaskOption.chainFirst(() =>
                    TaskOption.fromIO(user_black_list.addUser(user.id, mins))
                  )
                );
              }

              return TaskOption.tryCatch(() => replyMsg.reply(`${user.username} 逃過一劫`));
            }),
            TaskOption.map(({ replyMsg }) => replyMsg)
          )
      )
    );
}

export default banUser;
