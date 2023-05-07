import {
  Client,
  GuildMember,
  Awaitable,
  GuildTextBasedChannel,
  PartialGuildMember,
} from 'discord.js';
import * as TO from 'fp-ts/TaskOption';
import { pipe } from 'fp-ts/function';
import { getChannelByClient } from '../utils/channel';

const createLeaveMsg = (name: string) => {
  return `${name} 剛剛拔出了伺服器`;
};

function guildMemberRemoveListener(client: Client<true>) {
  return (guildMember: GuildMember | PartialGuildMember): Awaitable<void> => {
    const getLogChannel = getChannelByClient(process.env.LOG_CHANNEL_ID || '');
    pipe(
      getLogChannel(client),
      TO.fromOption,
      TO.flatMap((channel) =>
        TO.tryCatch(() =>
          (channel as GuildTextBasedChannel).send({
            content: createLeaveMsg(guildMember.nickname || guildMember.displayName),
            allowedMentions: { parse: [] },
          })
        )
      )
    )();
  };
}

export default guildMemberRemoveListener;
