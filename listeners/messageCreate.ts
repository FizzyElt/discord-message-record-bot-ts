import { Client, Message, Awaitable } from 'discord.js';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import excludeChannels from '../store/excludeChannels';
import recordCreateMsg from '../tasks/recordCreateMsg';

interface MessageCreateListener {
  (client: Client<true>): (msg: Message<boolean>) => Awaitable<void>;
}

const messageCreateListener: MessageCreateListener = (client) => (msg) => {
  pipe(
    O.some({ client, msg }),
    O.filter((params) => !params.msg.author.bot),
    O.filter((params) => !R.equals(params.msg.author.id, params.client.user.id)),
    O.filter((params) => !excludeChannels.hasChannel(params.msg.channelId)),
    TO.fromOption,
    TO.chain(recordCreateMsg)
  )();
};

export default messageCreateListener;
