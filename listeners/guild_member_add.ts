import { Client, GuildMember, Awaitable, GuildTextBasedChannel } from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { pipe } from 'fp-ts/function';
import { getChannelByClient } from '../utils/channel';

const createJoinMsg = (name: string) => {
  return `${name} 剛剛插入了伺服器`;
};

function guildMemberAddListener(client: Client<true>) {
  return (guildMember: GuildMember): Awaitable<void> => {
    const getLogChannel = getChannelByClient(process.env.LOG_CHANNEL_ID || '');
    pipe(
      getLogChannel(client),
      TO.fromOption,
      TO.chain((channel) =>
        TO.tryCatch(() =>
          (channel as GuildTextBasedChannel).send({
            content: createJoinMsg(guildMember.nickname || guildMember.displayName),
            allowedMentions: { parse: [] },
          })
        )
      )
    )();
  };
}

export default guildMemberAddListener;
