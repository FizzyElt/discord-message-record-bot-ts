import R from 'ramda';
import * as IORef from 'fp-ts/IORef';
import * as IO from 'fp-ts/IO';
import * as Set from 'fp-ts/Set';
import * as String from 'fp-ts/string';
import { pipe, flow } from 'fp-ts/function';

const userIdExisted = Set.elem(String.Eq);
const insertUser = Set.insert(String.Eq);
const removeUser = Set.remove(String.Eq);

const votingStoreRef = IORef.newIORef<Set<string>>(Set.empty);

const getVotingStore = () =>
  pipe(
    votingStoreRef,
    IO.map((store) => store.read())
  );

const writeVotingStore = (newSet: Set<string>) =>
  pipe(
    votingStoreRef,
    IO.chain((store) => store.write(newSet))
  );

const modifyVotingStore = (modifyFn: (set: Set<string>) => Set<string>) =>
  pipe(
    votingStoreRef,
    IO.chain((store) => store.modify(modifyFn))
  );

export const isUserVoting = (userId: string) =>
  pipe(getVotingStore(), IO.map(userIdExisted(userId)));

export const addNewVoting = (userId: string) => modifyVotingStore(insertUser(userId));

export const removeVoting = (userId: string) => modifyVotingStore(removeUser(userId));
