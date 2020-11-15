import { TextChannel } from 'discord.js';
import Logger from '../util/logger';
import { MessagePayloadType } from './messages';

type CommandStoreType = {
  list: (payload: MessagePayloadType) => Promise<void>;
  register: (payload: MessagePayloadType) => Promise<void>;
  unregister: (payload: MessagePayloadType) => Promise<void>;
  create: (payload: MessagePayloadType) => Promise<void>;
};

const COMMUNITY_CATEGORY = 'community channels';

async function list(payload: MessagePayloadType) {
  const { guild } = payload.source;
  const communityChannels = guild.channels.cache.filter((channel) => {
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
  });

  communityChannels.forEach((channel) =>
    Logger.info(channel.permissionOverwrites),
  );
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
