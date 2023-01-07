import { Client, Message, PartialMessage, Awaitable } from 'discord.js';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import excludeChannels from '../store/exclude_channels';
import recordDeletedMsg from '../tasks/record_deleted_msg';

interface MessageDeleteListener {
  (client: Client<true>): (msg: Message<boolean> | PartialMessage) => Awaitable<void>;
}

const messageDeleteListener: MessageDeleteListener = (client) => (msg) => {
  pipe(
    O.some({ msg, client }),
    O.filter((params) => !params.msg.author?.bot),
    O.filter((params) => !excludeChannels.hasChannel(params.msg.channelId)),
    TO.fromOption,
    TO.chain(recordDeletedMsg)
  )();
};

export default messageDeleteListener;