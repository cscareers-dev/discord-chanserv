import { Guild, GuildChannel } from 'discord.js';
import Logger from '../util/logger';
import { Maybe } from '../util/types';
import { DiscordMessageType, MessagePayloadType } from './messages';

type CommandStoreType = {
  list: (payload: MessagePayloadType) => Promise<void>;
  join: (payload: MessagePayloadType) => Promise<void>;
  leave: (payload: MessagePayloadType) => Promise<void>;
  create: (payload: MessagePayloadType) => Promise<void>;
};

type ChannelListType = {
  readonly name: string;
  readonly user_count: number;
  readonly channel: GuildChannel;
};

const COMMUNITY_CATEGORY = 'community channels';
const BOT_COMMANDS_CHANNEL = 'bot_commands';

const isFromBotChannel = (message: DiscordMessageType) => {
  const currentChannelId = message.channel.id;
  return Boolean(
    message.guild.channels.cache.find(
      ({ name, id }) =>
        name === BOT_COMMANDS_CHANNEL && id === currentChannelId,
    ),
  );
};

const fetchCommunityChannels = (guild: Maybe<Guild>): ChannelListType[] => {
  if (!guild) {
    return [];
  }

  return guild.channels.cache
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
};

const stripChannelName = (input: string) =>
  input.replace('#', '').replace(/ /g, '_').toLowerCase();

async function list(payload: MessagePayloadType) {
  const communityChannels = fetchCommunityChannels(payload.source.guild);

  // TODO: Create user friendly response.
  await payload.source
    .reply(JSON.stringify({ communityChannels }))
    .catch(Logger.error);
}

async function join(payload: MessagePayloadType) {
  if (!isFromBotChannel(payload.source)) {
    await payload.source.reply(
      'Please run this command in the #bot_commands channel',
    );
    return;
  }

  const strippedChannelName = stripChannelName(payload.source.content);
  const communityChannels = fetchCommunityChannels(payload.source.guild);
  const targetChannel = communityChannels.find(
    ({ channel }) => stripChannelName(channel.name) === strippedChannelName,
  )?.channel;

  if (!targetChannel) {
    await payload.source.reply('Unable to locate this channel');
    return;
  }

  await targetChannel
    .updateOverwrite(payload.source.author, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      READ_MESSAGE_HISTORY: true,
    })
    .then(
      async () => await payload.source.reply('Successfully registered channel'),
    )
    .catch(async (error) => {
      Logger.error(error);
      await payload.source.reply('Unable to register you for this channel :(');
    });
}

async function leave(payload: MessagePayloadType) {
  if (!isFromBotChannel(payload.source)) {
    await payload.source.reply(
      'Please run this command in the #bot_commands channel',
    );
    return;
  }

  const strippedChannelName = stripChannelName(payload.source.content);
  const communityChannels = fetchCommunityChannels(payload.source.guild);
  const targetChannel = communityChannels.find(
    ({ channel }) => stripChannelName(channel.name) === strippedChannelName,
  )?.channel;

  if (!targetChannel) {
    await payload.source.reply('Unable to locate this channel');
    return;
  }

  await targetChannel
    .updateOverwrite(payload.source.author, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
      READ_MESSAGE_HISTORY: false,
    })
    .then(async () => await payload.source.reply('Successfully left channel'))
    .catch(async (error) => {
      Logger.error(error);
      await payload.source.reply('Unable to leave channel :(');
    });
}

async function create(payload) {
  Logger.info('create cmd');
}

const CommandStore: CommandStoreType = {
  list,
  join,
  leave,
  create,
};

export default Object.freeze(CommandStore);
