import { Client, Message, PartialMessage, Awaitable } from 'discord.js';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import excludeChannels from '../store/exclude_channels';
import recordUpdatedMsg from '../tasks/record_updated_msg';

interface MessageUpdateListener {
  (client: Client<true>): (
    oldMsg: Message<boolean> | PartialMessage,
    newMsg: Message<boolean> | PartialMessage
  ) => Awaitable<void>;
}

const messageUpdateListener: MessageUpdateListener = (client) => (oldMsg, newMsg) => {
  pipe(
    O.some({ client, newMsg, oldMsg }),
    O.filter((params) => !params.newMsg.author?.bot),
    O.filter((params) => !excludeChannels.hasChannel(params.newMsg.channelId)),
    TO.fromOption,
    TO.chain(recordUpdatedMsg)
  )();
};

export default messageUpdateListener;