import { Client, Message, Awaitable } from 'discord.js';
import { pipe, flow, identity } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as IO from 'fp-ts/IO';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import { ChannelStoreRef, hasChannel } from '../store/exclude_channels';
import recordCreatedMsg from '../tasks/record_created_msg';
import inviteLinkGuard from '../tasks/invite_link_guard';

function messageCreateListener(client: Client<true>, channelStoreRef: ChannelStoreRef) {
  return (msg: Message<boolean>): Awaitable<void> => {
    pipe(
      TO.some({ client, msg }),
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
      TO.filter(({ msg }) => !msg.author.bot),
      TO.filter(({ client, msg }) => !R.equals(msg.author.id, client.user.id)),
      TO.tapIO(({ msg }) =>
        pipe(
          hasChannel(channelStoreRef)(msg.channelId),
          IO.map(flow(R.not, O.fromPredicate(identity)))
        )
      ),
      TO.flatMap(recordCreatedMsg)
    )();
  };
}

export default messageCreateListener;
