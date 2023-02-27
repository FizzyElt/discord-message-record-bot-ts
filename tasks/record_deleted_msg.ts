import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
import { flow } from 'fp-ts/function';
import * as R from 'ramda';
import { format } from 'date-fns';

import { getChannelByClient } from '../utils/channel';

function getDeletedMsgString(msg: Message<boolean> | PartialMessage) {
  const channelName = msg.channel.isTextBased()
    ? (msg.channel as GuildTextBasedChannel).name
    : 'Other';
  const userName = msg.author?.username || '';
  const discriminator = msg.author?.discriminator || '';

  return `${channelName} **[Created：${format(
    msg.createdAt,
    'yyyy/MM/dd HH:mm'
  )}]** ${userName}(#${discriminator}) **Delete**：\n${
    msg.content
  }\n------------------------------------`;
}

interface RecordDeleteMsg {
  (params: { client: Client<true>; msg: Message<boolean> | PartialMessage }): TaskOption.TaskOption<
    Message<true>
  >;
}

const recordDeleteMsg: RecordDeleteMsg = flow(
  TaskOption.some,
  TaskOption.bind('sendChannel', ({ client }) =>
    TaskOption.fromOption(getChannelByClient(process.env.BOT_SENDING_CHANNEL_ID || '')(client))
  ),
  TaskOption.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TaskOption.bind('sendString', flow(R.prop('msg'), getDeletedMsgString, TaskOption.of)),
  TaskOption.chain(({ sendChannel, sendString }) =>
    TaskOption.tryCatch(() =>
      (sendChannel as GuildTextBasedChannel).send({
        content: sendString,
        allowedMentions: { parse: [] },
      })
    )
  )
);

export default recordDeleteMsg;
