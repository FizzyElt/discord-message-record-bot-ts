import { Client, CommandInteraction } from 'discord.js';
import * as Option from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';
import * as Task from 'fp-ts/Task';
import * as TaskOption from 'fp-ts/TaskOption';
import * as IOOption from 'fp-ts/IOOption';
import { constant, pipe } from 'fp-ts/function';
import * as R from 'ramda';

import user_black_list from '../store/user_black_list';

import { getCommandOptionString } from '../utils/channel';
import isAdmin from '../utils/isAdmin';

function unbanUser(client: Client<true>) {
  return (interaction: CommandInteraction) =>
    pipe(
      isAdmin(interaction) ? Option.none : Option.some('你不是管理員，你沒有權限解 ban'),
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
      IOOption.getOrElse(constant(IO.of('找不到使用者'))),
      Task.fromIO,
      Task.chain((msg) => TaskOption.tryCatch(() => interaction.reply(msg)))
    );
}

export default unbanUser;
