import * as IORef from 'fp-ts/IORef';
import * as IO from 'fp-ts/IO';
import * as Map from 'fp-ts/Map';
import * as Option from 'fp-ts/Option';
import * as String from 'fp-ts/string';
import * as Array from 'fp-ts/Array';
import { pipe, tuple } from 'fp-ts/function';

import dotenv from 'dotenv';

dotenv.config();

export type ChannelStore = Map<string, string>;
export type ChannelStoreRef = IORef.IORef<ChannelStore>;

const isMember = Map.member(String.Eq);
const insertChannel = Map.upsertAt(String.Eq);
const unionChannel = Map.union<string, string>(String.Eq, { concat: (_, y) => y });
const deleteChannel = Map.pop(String.Eq);
const fromArray = Map.fromFoldable<'Array', string, string>(
  String.Eq,
  { concat: (_, y) => y },
  Array.Foldable
);

export const readChannelStore = (ref: ChannelStoreRef) =>
  pipe(
    IO.of(ref),
    IO.map((ref) => ref.read())
  );

export const hasChannel = (ref: ChannelStoreRef) => (id: string) =>
  pipe(readChannelStore(ref), IO.map(isMember(id)));

export const addChannel =
  (ref: ChannelStoreRef) =>
  ({ id, name = '' }: { id: string; name: string }) =>
    pipe(
      IO.of(ref),
      IO.chainFirst((ref) => ref.modify(insertChannel(id, name)))
    );

export const addChannels =
  (ref: ChannelStoreRef) =>
  (list: Array<{ id: string; name: string }> = []) => {
    const map = pipe(
      list,
      Array.map(({ id, name }) => tuple(id, name)),
      fromArray
    );

    return pipe(
      IO.of(ref),
      IO.chainFirst((ref) => ref.modify(unionChannel(map)))
    );
  };

export const removeChannel = (ref: ChannelStoreRef) => (id: string) =>
  pipe(
    IO.of(ref),
    IO.chainFirst((ref) =>
      ref.modify((map) =>
        pipe(
          deleteChannel(id)(map),
          Option.map(([, map]) => map),
          Option.getOrElse(() => map)
        )
      )
    )
  );

export const removeChannels =
  (ref: ChannelStoreRef) =>
  (ids: Array<string> = []) =>
    pipe(
      IO.of(ref),
      IO.chainFirst((ref) =>
        ref.modify(
          Map.filterWithIndex<string, string>(
            (key) => !ids.includes(key) || process.env.BOT_SENDING_CHANNEL_ID === key
          )
        )
      )
    );
