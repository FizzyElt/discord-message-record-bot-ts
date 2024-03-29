import * as Array from 'fp-ts/Array';
import * as R from 'ramda';

export type TimeoutInfo = {
  key: string;
  name: string;
  time: number; // second
  votingMinutes: number; // minute
  voteThreshold: number;
};

export const minute = 60;
export const hour = 60 * minute;
export const day = 24 * hour;
export const week = 7 * day;

export const choiceList: Array<TimeoutInfo> = [
  {
    key: '10-mins',
    name: '10 分鐘',
    time: 10 * minute,
    votingMinutes: 1,
    voteThreshold: 3,
  },
  {
    key: '30-mins',
    name: '30 分鐘',
    time: 30 * minute,
    votingMinutes: 3,
    voteThreshold: 3,
  },
  { key: '1-hour', name: '1 小時', time: hour, votingMinutes: 3, voteThreshold: 3 },
  { key: '1-day', name: '1 天', time: day, votingMinutes: 3, voteThreshold: 5 },
  { key: '1-week', name: '1 星期', time: week, votingMinutes: 6, voteThreshold: 6 },
  { key: '4-week', name: '28 天', time: 28 * day, votingMinutes: 8, voteThreshold: 6 },
];

export const findTimeoutInfo = (key: string) => Array.findFirst(R.propEq('key', key))(choiceList);
