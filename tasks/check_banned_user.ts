import { Message } from 'discord.js';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import { pipe, flow } from 'fp-ts/function';
import { format } from 'date-fns/fp';
import { isAfter } from 'date-fns';
import * as R from 'ramda';
import userBlackList from '../store/user_black_list';

interface CheckBannedUser {
  (msg: Message<boolean>): TO.TaskOption<Message<boolean>>;
}

const checkBannedUser: CheckBannedUser = (msg) =>
  pipe(
    userBlackList.getBanedUser(msg.author.id),
    O.filter((date) =>
      pipe(
        isAfter(Date.now(), date),
        R.tap((isExpired) => isExpired && userBlackList.removeUser(msg.author.id)),
        R.not
      )
    ),
    O.map(
      flow(
        format('yyyy-MM-dd HH:mm:ss'),
        (dateString) => `你已被禁言，下次可發言時間為 UTC ${dateString}`
      )
    ),
    TO.fromOption,
    TO.chain((sendString) =>
      TO.tryCatch<Message<false> | Message<true>>(() => msg.channel.send(sendString))
    ),
    TO.chain(() => TO.tryCatch(() => msg.delete()))
  );

export default checkBannedUser;
