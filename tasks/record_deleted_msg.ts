import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { flow } from 'fp-ts/function';
import { format } from 'date-fns';

interface RecordDeleteMsg {
  (params: { client: Client<true>; msg: Message<boolean> | PartialMessage }): TO.TaskOption<
    Message<true>
  >;
}

const recordDeleteMsg: RecordDeleteMsg = flow(
  TO.some,
  TO.bind('sendChannel', ({ client }) =>
    TO.fromNullable(client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID || ''))
  ),
  TO.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TO.bind(
    'sendString',
    flow(({ msg }) => {
      const channelName = msg.channel.isTextBased()
        ? (msg.channel as GuildTextBasedChannel).name
        : 'Other';
      const userName = msg.author?.username || '';
      const discriminator = msg.author?.discriminator || '';

      return `TS version ${channelName} **[Created：${format(
        msg.createdAt,
        'yyyy/MM/dd HH:mm'
      )}]** ${userName}(#${discriminator}) **Delete**：\n${
        msg.content
      }\n------------------------------------`;
    }, TO.some)
  ),
  TO.chain(({ sendChannel, sendString }) =>
    TO.tryCatch(() =>
      (sendChannel as GuildTextBasedChannel).send({
        content: sendString,
        allowedMentions: { parse: [] },
      })
    )
  )
);

export default recordDeleteMsg;
