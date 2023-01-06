import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { flow } from 'fp-ts/function';
import { format } from 'date-fns';

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
    TO.fromNullable(client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID || ''))
  ),
  TO.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TO.bind('sendString', ({ newMsg }) => {
    const channelName = newMsg.channel.isTextBased()
      ? (newMsg.channel as GuildTextBasedChannel).name
      : 'Other';

    const userName = newMsg.author?.username || '';
    const discriminator = newMsg.author?.discriminator || '';

    return TO.some(
      `TS version ${channelName} **[Created：${format(
        newMsg.createdAt,
        'yyyy/MM/dd HH:mm'
      )}]** ${userName}(#${discriminator}) **Edit**：\n${
        newMsg.content
      }\n------------------------------------`
    );
  }),
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
