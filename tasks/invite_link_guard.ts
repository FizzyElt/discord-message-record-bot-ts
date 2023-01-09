import { Message, PartialMessage } from 'discord.js';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import { flow, pipe } from 'fp-ts/function';
import * as R from 'ramda';

const discordInviteRegex = /discord\.gg\/(\w|\d)+/;

const isDiscordInviteString = (str: string) => discordInviteRegex.test(str);

const inviteLinkGuard = flow<
  [Message<boolean> | PartialMessage],
  O.Option<Message<boolean> | PartialMessage>,
  TO.TaskOption<Message<boolean> | PartialMessage>,
  TO.TaskOption<Message<boolean> | PartialMessage>
>(
  R.ifElse(
    flow(R.prop('content'), O.fromNullable, O.getOrElse(R.always('')), isDiscordInviteString),
    O.some,
    R.always(O.none)
  ),
  TO.fromOption,
  TO.chain(R.ifElse(R.prop('deletable'), (msg) => TO.tryCatch(() => msg.delete()), TO.of))
);

export default inviteLinkGuard;
