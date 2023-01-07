import { Client, Message, Awaitable } from 'discord.js';
import { pipe, flow } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import excludeChannels from '../store/exclude_channels';
import recordCreatedMsg from '../tasks/record_created_msg';
import checkBannedUser from '../tasks/check_banned_user';

interface MessageCreateListener {
  (client: Client<true>): (msg: Message<boolean>) => Awaitable<void>;
}

const messageCreateListener: MessageCreateListener = (client) => (msg) => {
  pipe(
    TO.some({ client, msg }),
    TO.chainFirst(
      flow(
        R.prop('msg'),
        checkBannedUser,
        TO.match(
          () => O.some(0),
          () => O.none
        )
      )
    ),
    TO.filter(({ msg }) => !msg.author.bot),
    TO.filter(({ client, msg }) => !R.equals(msg.author.id, client.user.id)),
    TO.filter(({ msg }) => !excludeChannels.hasChannel(msg.channelId)),
    TO.chain(recordCreatedMsg)
  )();
};

export default messageCreateListener;