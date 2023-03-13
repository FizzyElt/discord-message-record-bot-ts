import R from 'ramda';
import * as IORef from 'fp-ts/IORef';
import * as IO from 'fp-ts/IO';
import * as Set from 'fp-ts/Set';
import * as String from 'fp-ts/string';
import { pipe, flow } from 'fp-ts/function';

const userIdExisted = Set.elem(String.Eq);
const insertUser = Set.insert(String.Eq);
const removeUser = Set.remove(String.Eq);

const readVotingRef = (ref: IORef.IORef<Set<string>>) =>
  pipe(
    IO.of(ref),
    IO.map((ref) => ref.read())
  );

export const isUserVoting = (userId: string) => (ref: IORef.IORef<Set<string>>) =>
  pipe(readVotingRef(ref), IO.map(userIdExisted(userId)));

export const addNewVoting = (userId: string) => (ref: IORef.IORef<Set<string>>) =>
  pipe(
    IO.of(ref),
    IO.chainFirst((ref) => ref.modify(insertUser(userId)))
  );

export const removeVoting = (userId: string) => (ref: IORef.IORef<Set<string>>) =>
  pipe(
    IO.of(ref),
    IO.chainFirst((ref) => ref.modify(removeUser(userId)))
  );
