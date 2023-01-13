import { Message, PartialMessage } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { flow } from 'fp-ts/function';
import * as R from 'ramda';

const discordInviteRegex = /discord\.gg\/(\w|\d)+/;

function isDiscordInviteString(str: string) {
  return discordInviteRegex.test(str);
}

const inviteLinkGuard = flow<
  [Message<boolean> | PartialMessage],
  TO.TaskOption<Message<boolean> | PartialMessage>,
  TO.TaskOption<Message<boolean> | PartialMessage>,
  TO.TaskOption<Message<boolean> | PartialMessage>
>(
  TO.of,
  TO.filter((msg) => R.is(String, msg.content) && isDiscordInviteString(msg.content)),
  TO.chain(R.ifElse(R.prop('deletable'), (msg) => TO.tryCatch(() => msg.delete()), TO.of))
);

// R.ifElse(
//   flow(R.prop('content'), O.fromNullable, O.getOrElse(R.always('')), isDiscordInviteString),
//   O.some,
//   R.always(O.none)
// ),
export default inviteLinkGuard;
