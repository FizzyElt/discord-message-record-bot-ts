import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { flow } from 'fp-ts/function';
import * as R from 'ramda';
import { format } from 'date-fns';

import { getChannelByClient } from '../utils/channel';

function getUpdatedMsgString(msg: Message<boolean> | PartialMessage) {
  const channelName = msg.channel.isTextBased()
    ? (msg.channel as GuildTextBasedChannel).name
    : 'Other';

  const userName = msg.author?.username || '';
  const discriminator = msg.author?.discriminator || '';

  return `${channelName} **[Created：${format(
    msg.createdAt,
    'yyyy/MM/dd HH:mm'
  )}]** ${userName}(#${discriminator}) **Edit**：\n${
    msg.content
  }\n------------------------------------`;
}

interface RecordUpdateMsg {
  (params: {
    client: Client<true>;
    oldMsg: Message<boolean> | PartialMessage;
    newMsg: Message<boolean> | PartialMessage;
  }): TO.TaskOption<Message<true>>;
}

const recordUpdateMsg: RecordUpdateMsg = flow(
  TO.some,
  TO.bind('sendChannel', ({ client }) =>
    TO.fromOption(getChannelByClient(process.env.BOT_SENDING_CHANNEL_ID || '')(client))
  ),
  TO.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TO.bind('sendString', flow(R.prop('newMsg'), getUpdatedMsgString, TO.of)),
  TO.chain(({ sendChannel, oldMsg, sendString }) =>
    TO.tryCatch(() =>
      (sendChannel as GuildTextBasedChannel).send({
        content: sendString,
        allowedMentions: { parse: [] },
        reply: {
          messageReference: oldMsg.reference?.messageId || '',
        },
      })
    )
  )
);

export default recordUpdateMsg;
