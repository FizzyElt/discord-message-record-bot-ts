import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
import * as R from 'ramda';
import { flow } from 'fp-ts/function';
import { format } from 'date-fns';

import { getChannelByClient } from '../utils/channel';

function getCreatedMsgString(msg: Message<boolean> | PartialMessage) {
  const channelName = msg.channel.isTextBased()
    ? (msg.channel as GuildTextBasedChannel).name
    : 'Other';
  const userName = msg.author?.username || '';
  const discriminator = msg.author?.discriminator || '';

  return `${channelName} **[Created：${format(
    msg.createdAt,
    'yyyy/MM/dd HH:mm'
  )}]** ${userName}(#${discriminator})：\n${msg.content}\n------------------------------------`;
}

interface RecordCreateMsg {
  (params: { client: Client<true>; msg: Message<boolean> | PartialMessage }): TaskOption.TaskOption<
    Message<true>
  >;
}

const recordCreateMsg: RecordCreateMsg = flow(
  TaskOption.some,
  TaskOption.bind('sendChannel', ({ client }) =>
    TaskOption.fromOption(getChannelByClient(process.env.BOT_SENDING_CHANNEL_ID || '')(client))
  ),
  TaskOption.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TaskOption.bind('sendString', flow(R.prop('msg'), getCreatedMsgString, TaskOption.of)),
  TaskOption.bind('sentMsg', ({ sendChannel, sendString }) =>
    TaskOption.tryCatch(() =>
      (sendChannel as GuildTextBasedChannel).send({
        content: sendString,
        allowedMentions: { parse: [] },
      })
    )
  ),
  TaskOption.map(
    R.tap(({ sentMsg, msg }) => {
      msg.reference = {
        channelId: sentMsg.channelId,
        guildId: sentMsg.guildId,
        messageId: sentMsg.id,
      };
    })
  ),
  TaskOption.map(R.prop('sentMsg'))
);

export default recordCreateMsg;
