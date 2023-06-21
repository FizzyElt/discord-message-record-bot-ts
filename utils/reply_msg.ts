import { formatInTimeZone } from 'date-fns-tz';
import { formatDistanceToNow } from 'date-fns';
import { choiceList } from './voteChoice';
import { pipe } from 'fp-ts/function';
import * as R from 'ramda';
import dotenv from 'dotenv';

import type { GuildMember } from 'discord.js';
import type { TimeoutInfo } from './voteChoice';

dotenv.config();

// reply all message
export const canNotFindUser = (): string => '找不到使用者';

export const doNotBanAdmin = (): string => '你不可以 ban 管理員';

export const doNotBanBot = (): string => '你不可以 ban 我';

export const isMemberVoting = (member: GuildMember): string =>
  `**${member.nickname || member.user.username}** 正在審判中\n請等待審判結束後重新發起投票`;

export const memberDisableTime = (
  member: GuildMember & {
    communicationDisabledUntilTimestamp: number;
    readonly communicationDisabledUntil: Date;
  }
): string =>
  `**${member.nickname || member.user.username}** 還在服刑\n剩餘時間 ${formatDistanceToNow(
    member.communicationDisabledUntil
  )}\n出獄時間 ${formatInTimeZone(
    member.communicationDisabledUntil,
    process.env.TIMEZONE || 'Asia/Taipei',
    'yyyy-MM-dd HH:mm'
  )}`;

export const isMemberFree = (member: GuildMember, count: number): string =>
  `**${count}** 票，**${member.nickname || member.user.username}** 逃過一劫`;

export const memberTimeoutVotePassed = (
  member: GuildMember,
  timeoutInfo: TimeoutInfo,
  count: number
): string =>
  `恭喜獲得 **${count} / ${timeoutInfo.voteThreshold}** 票 **${
    member.nickname || member.user.username
  }** 禁言 ${timeoutInfo.name}`;

export const startMemberVote = (member: GuildMember, timeoutInfo: TimeoutInfo): string =>
  `是否禁言 **${member.nickname || member.user.username} ** ${timeoutInfo.name}\n*${
    timeoutInfo.votingMinutes
  } 分鐘後累積 ${timeoutInfo.voteThreshold} 票者禁言*`;

export const listTimeoutChoices = () =>
  pipe(
    choiceList,
    R.map(
      ({ name, voteThreshold, votingMinutes }) => `${name} ${votingMinutes}分鐘 ${voteThreshold}票`
    ),
    R.join('\n')
  );
