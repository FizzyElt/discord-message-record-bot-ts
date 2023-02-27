import { Client, CommandInteraction } from 'discord.js';
import * as Option from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';
import * as Task from 'fp-ts/Task';
import * as TaskOption from 'fp-ts/TaskOption';
import * as IOOption from 'fp-ts/IOOption';
import { pipe, constant } from 'fp-ts/function';

import * as R from 'ramda';

import user_black_list from '../store/user_black_list';

import isAdmin from '../utils/isAdmin';
import { getCommandOptionString, getCommandOptionInt } from '../utils/channel';

function banUser(client: Client<true>) {
  return (interaction: CommandInteraction) =>
    pipe(
      isAdmin(interaction) ? Option.none : Option.some('不是管理員還敢 ban 人阿'),
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
      IOOption.getOrElse(constant(IO.of('找不到使用者'))),
      Task.fromIO,
      Task.chain((msg) => TaskOption.tryCatch(() => interaction.reply(msg)))
    );
}

export default banUser;
