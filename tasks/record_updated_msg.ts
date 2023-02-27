import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
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
  }): TaskOption.TaskOption<Message<true>>;
}

const recordUpdateMsg: RecordUpdateMsg = flow(
  TaskOption.some,
  TaskOption.bind('sendChannel', ({ client }) =>
    TaskOption.fromOption(getChannelByClient(process.env.BOT_SENDING_CHANNEL_ID || '')(client))
  ),
  TaskOption.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TaskOption.bind('sendString', flow(R.prop('newMsg'), getUpdatedMsgString, TaskOption.of)),
  TaskOption.chain(({ sendChannel, oldMsg, sendString }) =>
    TaskOption.tryCatch(() =>
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
