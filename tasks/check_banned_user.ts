import { Message } from 'discord.js';
import * as O from 'fp-ts/Option';
import * as TaskOption from 'fp-ts/TaskOption';
import * as Task from 'fp-ts/Task';
import * as IO from 'fp-ts/IO';
import * as IOOption from 'fp-ts/IOOption';
import { pipe, flow } from 'fp-ts/function';
import { format } from 'date-fns/fp';
import { isAfter } from 'date-fns';
import userBlackList from '../store/user_black_list';

function checkBannedUser(msg: Message<boolean>): TaskOption.TaskOption<Message<boolean>> {
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
    Task.fromIO,
    TaskOption.chainFirst(() => TaskOption.tryCatch(() => msg.delete())),
    TaskOption.chain(
      flow(
        format('yyyy-MM-dd HH:mm:ss'),
        (dateString) => `你已被禁言，下次可發言時間為 UTC ${dateString}`,
        (sendString) =>
          TaskOption.tryCatch<Message<false> | Message<true>>(() => msg.channel.send(sendString))
      )
    )
  );
}

export default checkBannedUser;
