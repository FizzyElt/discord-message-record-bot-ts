import { Client, Message, PartialMessage, GuildTextBasedChannel } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { flow, pipe } from 'fp-ts/function';
import { format } from 'date-fns';
import * as R from 'ramda';

interface RecordCreateMsg {
  (params: { client: Client<true>; msg: Message<boolean> | PartialMessage }): TO.TaskOption<
    Message<true>
  >;
}

const recordCreateMsg: RecordCreateMsg = flow(
  TO.some,
  TO.bind('sendChannel', ({ client }) =>
    TO.fromNullable(client.channels.cache.get(process.env.BOT_SENDING_CHANNEL_ID || ''))
  ),
  TO.filter(({ sendChannel }) => sendChannel.isTextBased()),
  TO.bind('sendString', ({ msg }) => {
    const channelName = msg.channel.isTextBased()
      ? (msg.channel as GuildTextBasedChannel).name
      : 'Other';
    const userName = msg.author?.username || '';
    const discriminator = msg.author?.discriminator || '';

    return TO.some(
      `TS version${channelName} **[Created：${format(
        msg.createdAt,
        'yyyy/MM/dd HH:mm'
      )}]** ${userName}(#${discriminator})：\n${msg.content}\n------------------------------------`
    );
  }),
  TO.chain(({ msg, sendChannel, sendString }) =>
    pipe(
      TO.tryCatch(() =>
        (sendChannel as GuildTextBasedChannel).send({
          content: sendString,
          allowedMentions: { parse: [] },
        })
      ),
      TO.map(
        R.tap((sentMsg) => {
          msg.reference = {
            channelId: sentMsg.channelId,
            guildId: sentMsg.guildId,
            messageId: sentMsg.id,
          };
        })
      )
    )
  )
);

export default recordCreateMsg;
