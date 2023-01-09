import { Client, Message, PartialMessage, Awaitable } from 'discord.js';
import { pipe, flow } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TO from 'fp-ts/TaskOption';
import * as R from 'ramda';
import excludeChannels from '../store/exclude_channels';
import recordDeletedMsg from '../tasks/record_deleted_msg';
import inviteLinkGuard from '../tasks/invite_link_guard';

interface MessageDeleteListener {
  (client: Client<true>): (msg: Message<boolean> | PartialMessage) => Awaitable<void>;
}

const messageDeleteListener: MessageDeleteListener = (client) => (msg) => {
  pipe(
    TO.some({ msg, client }),
    TO.chainFirst(
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
    TO.filter((params) => !excludeChannels.hasChannel(params.msg.channelId)),
    TO.chain(recordDeletedMsg)
  )();
};

export default messageDeleteListener;
