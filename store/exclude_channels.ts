import * as R from 'ramda';
import * as IORef from 'fp-ts/IORef';
import * as IO from 'fp-ts/IO';
import { pipe, flow } from 'fp-ts/function';
import dotenv from 'dotenv';

dotenv.config();

const sendedChannel = {
  id: process.env.BOT_SENDING_CHANNEL_ID as string,
  name: process.env.BOT_SENDING_CHANNEL_NAME as string,
};

const excludeChannelsRef = IORef.newIORef(
  new Map<string, string>([[sendedChannel.id, sendedChannel.name]])
);

const hasChannel = (id: string) =>
  pipe(
    getChannelMap(),
    IO.map((map) => map.has(id))
  );

const getChannelMap = () =>
  pipe(
    excludeChannelsRef,
    IO.map((ref) => ref.read())
  );

const addChannel = ({ id, name = '' }: { id: string; name: string }) =>
  pipe(
    excludeChannelsRef,
    IO.chainFirst((ref) => ref.modify((map) => map.set(id, name))),
    IO.map((ref) => ref.read())
  );

const addChannels = (list: Array<{ id: string; name: string }> = []) =>
  pipe(
    excludeChannelsRef,
    IO.chain((ref) => ref.modify((map) => (list.forEach(({ id, name }) => map.set(id, name)), map)))
  );

const removeChannel = (id: string) =>
  pipe(
    excludeChannelsRef,
    IO.map((ref) => {
      if (R.equals(id, sendedChannel.id)) return false;

      const map = ref.read();
      const res = map.delete(id);
      ref.write(map);
      return res;
    })
  );

const removeChannels = (ids: Array<string> = []) =>
  pipe(
    IO.Do,
    IO.bind('ref', () => excludeChannelsRef),
    IO.bind('ids', () => IO.of(ids.filter(flow(R.equals(sendedChannel.id), R.not)))),
    IO.map(({ ref, ids }) => ref.modify((map) => (ids.forEach((id) => map.delete(id)), map)))
  );

export default {
  hasChannel,
  getChannelMap,
  addChannel,
  addChannels,
  removeChannel,
  removeChannels,
};
