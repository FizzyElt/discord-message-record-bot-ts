import dotenv from 'dotenv';
import { pipe } from 'fp-ts/function';
import * as R from 'ramda';
import * as O from 'fp-ts/Option';
import { parseISO, addMinutes, formatISO } from 'date-fns';

dotenv.config();

const userBlackList = new Map<string, string>();

interface HasUser {
  (id: string): boolean;
}

const hasUser: HasUser = (id) => userBlackList.has(id);

interface GetBanedUser {
  (id: string): O.Option<Date>;
}
const getBanedUser: GetBanedUser = (id) =>
  pipe(userBlackList.get(id), O.fromNullable, O.map(parseISO));

interface GetUserBannedMap {
  (): Map<string, string>;
}
const getUserBannedMap: GetUserBannedMap = () => userBlackList;

interface AddUser {
  (id: string, time: number): Map<string, string>;
}

const addUser: AddUser = R.curry((id: string, time = 0) =>
  userBlackList.set(id, formatISO(addMinutes(Date.now(), time)))
);

interface RemoveUser {
  (id: string): boolean;
}

const removeUser: RemoveUser = (id) => userBlackList.delete(id);

export default {
  hasUser,
  addUser,
  removeUser,
  getBanedUser,
  getUserBannedMap,
};
