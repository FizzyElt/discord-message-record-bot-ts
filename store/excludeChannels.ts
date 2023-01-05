import * as IO from 'fp-ts/IO';
import * as R from 'ramda';
import dotenv from 'dotenv';

dotenv.config();

const sendedChannel = {
  id: process.env.BOT_SENDING_CHANNEL_ID as string,
  name: process.env.BOT_SENDING_CHANNEL_NAME as string,
};

const excludeChannels = new Map<string, string>([[sendedChannel.id, sendedChannel.name]]);

interface HasChannel {
  (id: string): boolean;
}

const hasChannel: HasChannel = (id) => excludeChannels.has(id);

interface GetChannelMap {
  (): IO.IO<Map<string, string>>;
}

const getChannelMap: GetChannelMap = () => () => excludeChannels;

interface AddChannel {
  (params: { id: string; name: string }): IO.IO<Map<string, string>>;
}

const addChannel: AddChannel =
  ({ id, name = '' }) =>
  () =>
    excludeChannels.set(id, name);

interface AddChannels {
  (list: Array<{ id: string; name: string }>): IO.IO<void>;
}

const addChannels: AddChannels =
  (list = []) =>
  () =>
    list.forEach(({ id, name }) => excludeChannels.set(id, name));

interface RemoveChannel {
  (id: string): IO.IO<boolean>;
}

const removeChannel: RemoveChannel = (id) => () => {
  if (R.equals(id, sendedChannel.id)) return false;

  return excludeChannels.delete(id);
};

interface RemoveChannels {
  (ids: Array<string>): IO.IO<void>;
}

const removeChannels: RemoveChannels =
  (ids = []) =>
  () => {
    ids.filter(R.equals(sendedChannel.id)).forEach((id) => {
      excludeChannels.delete(id);
    });
  };

export default {
  hasChannel,
  getChannelMap,
  addChannel,
  addChannels,
  removeChannel,
  removeChannels,
};
