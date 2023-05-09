import { Client, Message, PartialMessage, Awaitable } from 'discord.js';
import { pipe, flow, identity } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import { ChannelStoreRef, hasChannel } from '../store/exclude_channels';
import recordDeletedMsg from '../tasks/record_deleted_msg';
import inviteLinkGuard from '../tasks/invite_link_guard';

function messageDeleteListener(client: Client<true>, channelStoreRef: ChannelStoreRef) {
  return (msg: Message<boolean> | PartialMessage): Awaitable<void> => {
    pipe(
      TO.some({ msg, client }),
      TO.tap(
        flow(
          R.prop('msg'),
          inviteLinkGuard,
          TO.match(
            () => O.some(0),
            () => O.none
          )
        )
      ),
      TO.filter((params) => !params.msg.author?.bot),
      TO.chainFirstIOK(({ msg }) =>
        pipe(
          hasChannel(channelStoreRef)(msg.channelId),
          IO.map(flow(R.not, O.fromPredicate(identity)))
        )
      ),
      TO.flatMap(recordDeletedMsg)
    )();
  };
}

export default messageDeleteListener;
