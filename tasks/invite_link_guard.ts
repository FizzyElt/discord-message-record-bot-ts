import { Message, PartialMessage } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
import { flow } from 'fp-ts/function';
import * as R from 'ramda';

const discordInviteRegex = /discord\.gg\/(\w|\d)+/;

function isDiscordInviteString(str: string) {
  return discordInviteRegex.test(str);
}

const inviteLinkGuard = flow<
  [Message<boolean> | PartialMessage],
  TaskOption.TaskOption<Message<boolean> | PartialMessage>,
  TaskOption.TaskOption<Message<boolean> | PartialMessage>,
  TaskOption.TaskOption<Message<boolean> | PartialMessage>
>(
  TaskOption.of,
  TaskOption.filter((msg) => R.is(String, msg.content) && isDiscordInviteString(msg.content)),
  TaskOption.flatMap(
    R.ifElse(R.prop('deletable'), (msg) => TaskOption.tryCatch(() => msg.delete()), TaskOption.of)
  )
);

// R.ifElse(
//   flow(R.prop('content'), O.fromNullable, O.getOrElse(R.always('')), isDiscordInviteString),
//   O.some,
//   R.always(O.none)
// ),
export default inviteLinkGuard;
