import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
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
  (params: { client: Client<true>; msg: Message<boolean> | PartialMessage }): TO.TaskOption<
    Message<true>
  >;
}

const recordCreateMsg: RecordCreateMsg = flow(
  TO.some,
  TO.bind('sendChannel', ({ client }) =>
    TO.fromOption(getChannelByClient(process.env.BOT_SENDING_CHANNEL_ID || '')(client))
  ),
  TO.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TO.bind('sendString', flow(R.prop('msg'), getCreatedMsgString, TO.of)),
  TO.bind('sentMsg', ({ sendChannel, sendString }) =>
    TO.tryCatch(() =>
      (sendChannel as GuildTextBasedChannel).send({
        content: sendString,
        allowedMentions: { parse: [] },
      })
    )
  ),
  TO.map(
    R.tap(({ sentMsg, msg }) => {
      msg.reference = {
        channelId: sentMsg.channelId,
        guildId: sentMsg.guildId,
        messageId: sentMsg.id,
      };
    })
  ),
  TO.map(R.prop('sentMsg'))
);

export default recordCreateMsg;
