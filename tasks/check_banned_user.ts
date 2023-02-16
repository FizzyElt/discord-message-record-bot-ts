import { Message } from 'discord.js';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import * as T from 'fp-ts/Task';
import * as IO from 'fp-ts/IO';
import * as IOOption from 'fp-ts/IOOption';
import { pipe, flow } from 'fp-ts/function';
import { format } from 'date-fns/fp';
import { isAfter } from 'date-fns';
import userBlackList from '../store/user_black_list';

function checkBannedUser(msg: Message<boolean>): TO.TaskOption<Message<boolean>> {
  return pipe(
    userBlackList.getBanedUser(msg.author.id),
    IOOption.chainFirst((date) =>
      pipe(
        isAfter(Date.now(), date),
        IO.of,
        IO.chainFirst((isExpired) =>
          isExpired ? userBlackList.removeUser(msg.author.id) : IO.of(isExpired)
        ),
        IO.map((isExpired) => (isExpired ? O.none : O.some(isExpired)))
      )
    ),
    T.fromIO,
    TO.chainFirst(() => TO.tryCatch(() => msg.delete())),
    TO.chain(
      flow(
        format('yyyy-MM-dd HH:mm:ss'),
        (dateString) => `你已被禁言，下次可發言時間為 UTC ${dateString}`,
        (sendString) =>
          TO.tryCatch<Message<false> | Message<true>>(() => msg.channel.send(sendString))
      )
    )
  );
}

export default checkBannedUser;
