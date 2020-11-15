import { GuildChannel } from 'discord.js';
import Logger from '../util/logger';
import { MessagePayloadType } from './messages';

type CommandStoreType = {
  list: (payload: MessagePayloadType) => Promise<void>;
  register: (payload: MessagePayloadType) => Promise<void>;
  unregister: (payload: MessagePayloadType) => Promise<void>;
  create: (payload: MessagePayloadType) => Promise<void>;
};

type ChannelListType = {
  readonly name: string;
  readonly user_count: number;
  readonly channel: GuildChannel;
};

const COMMUNITY_CATEGORY = 'community channels';

async function list(payload: MessagePayloadType) {
  const { guild } = payload.source;
  const communityChannels: ChannelListType[] = guild.channels.cache
    .filter((channel) => {
      const { parentID } = channel;
      if (!parentID) {
        return false;
      }

      const categoryName = (
        guild.channels.cache.get(parentID)?.name || ''
      ).toLowerCase();
      if (!categoryName) {
        return false;
      }

      return categoryName === COMMUNITY_CATEGORY;
    })
    .reduce((acc: ChannelListType[], channel) => {
      const totalUsers = channel.permissionOverwrites.filter(
        (permission) => permission.type === 'member',
      ).size;
      if (totalUsers === 0) {
        return acc;
      }

      acc.push({
        name: channel.name,
        user_count: totalUsers,
        channel: channel,
      });

      return acc;
    }, [])
    .sort((a, b) => b.user_count - a.user_count);

  // TODO: Create user friendly response.
  await payload.source
    .reply(JSON.stringify({ communityChannels }))
    .catch(Logger.error);
}

async function register(payload) {
  Logger.info('register cmd');
}

async function unregister(payload) {
  Logger.info('unregister cmd');
}

async function create(payload) {
  Logger.info('create cmd');
}

const CommandStore: CommandStoreType = {
  list,
  register,
  unregister,
  create,
};

export default Object.freeze(CommandStore);
