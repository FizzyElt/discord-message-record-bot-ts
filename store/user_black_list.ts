import dotenv from 'dotenv';
import { pipe, flow } from 'fp-ts/function';
import * as R from 'ramda';
import * as O from 'fp-ts/Option';
import * as IORef from 'fp-ts/IORef';
import * as IO from 'fp-ts/IO';

import { parseISO, addMinutes, formatISO } from 'date-fns';

dotenv.config();

const userBlackList = IORef.newIORef(new Map<string, string>());

const getUserBannedMap = () =>
  pipe(
    userBlackList,
    IO.map((ref) => ref.read())
  );

const hasUser = (id: string) =>
  pipe(
    getUserBannedMap(),
    IO.map((map) => map.has(id))
  );

const getBanedUser = (id: string) =>
  pipe(getUserBannedMap(), IO.map(flow((map) => map.get(id), O.fromNullable, O.map(parseISO))));

interface AddUser {
  (id: string, time: number): Map<string, string>;
}

const addUser = R.curry((id: string, time: number = 0) =>
  pipe(
    userBlackList,
    IO.chainFirst((ref) =>
      ref.modify((map) => map.set(id, formatISO(addMinutes(Date.now(), time))))
    ),
    IO.map((ref) => ref.read())
  )
);

const removeUser = (id: string) =>
  pipe(
    userBlackList,
    IO.map((ref) => {
      const map = ref.read();
      const res = map.delete(id);
      ref.write(map);
      return res;
    })
  );

export default {
  hasUser,
  addUser,
  removeUser,
  getBanedUser,
  getUserBannedMap,
};
