import { Client, Message, PartialMessage, Awaitable } from 'discord.js';
import { pipe, flow, identity } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import { ChannelStoreRef, hasChannel } from '../store/exclude_channels';
import recordUpdatedMsg from '../tasks/record_updated_msg';

function messageUpdateListener(client: Client<true>, channelStoreRef: ChannelStoreRef) {
  return (
    oldMsg: Message<boolean> | PartialMessage,
    newMsg: Message<boolean> | PartialMessage
  ): Awaitable<void> => {
    pipe(
      O.some({ client, newMsg, oldMsg }),
      O.filter((params) => !params.newMsg.author?.bot),
      TO.fromOption,
      TO.chainFirstIOK(({ newMsg }) =>
        pipe(
          hasChannel(channelStoreRef)(newMsg.channelId),
          IO.map(flow(R.not, O.fromPredicate(identity)))
        )
      ),
      TO.flatMap(recordUpdatedMsg)
    )();
  };
}

export default messageUpdateListener;
