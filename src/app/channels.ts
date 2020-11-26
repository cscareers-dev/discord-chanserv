import { CategoryChannel, Guild, GuildChannel, TextChannel } from 'discord.js';
import Constants from '../constants';
import { Maybe } from '../util/types';
import { DiscordMessageType } from './messages';

export type ChannelRequestType = {
  readonly user: string;
  readonly channelName: string;
};

type ChannelListType = {
  readonly name: string;
  readonly user_count: number;
  readonly channel: GuildChannel;
};

export const INVALID_CHANNEL_NAMES = new Set(['instructions']);
export const BOT_COMMANDS_CHANNEL = Constants.BotCommandsChannel;
export const COMMUNITY_CATEGORY_PREFIX = Constants.CommunityCategoryPrefix;
const MAX_CHANNEL_LIMIT = 50;

export const createChannel = async (
  request: ChannelRequestType,
  guild: Maybe<Guild>,
) => {
  if (!guild) {
    throw new Error(`Unable to locate guild ${JSON.stringify(request)}`);
  }

  // Since Discord categories are only allowed to have at most 50 child-channels, we need to determine
  // which available categories we can create this channel in.
  const communityCategories = guild.channels.cache
    .filter((channel) => channel.name.startsWith(COMMUNITY_CATEGORY_PREFIX))
    .reduce((acc, channel) => {
      acc[channel.name] = [0, channel as CategoryChannel];
      return acc;
    }, {} as Record<string, [number, CategoryChannel]>);

  if (Object.keys(communityCategories).length === 0) {
    throw new Error(
      `Unable to locate community categories ${JSON.stringify(request)}`,
    );
  }

  fetchCommunityChannels(guild)
    .map((channel) => channel.channel)
    .forEach((channel) => {
      const categoryName = guild.channels.cache
        .get(channel.parentID || '')
        ?.name.toLowerCase();
      if (!categoryName) {
        return;
      }
      const [channelCount, categoryChannel] = communityCategories[categoryName];
      communityCategories[categoryName] = [channelCount + 1, categoryChannel];
    });

  const availableCategoryName = Object.keys(communityCategories).find(
    (category) => {
      const [channelCount] = communityCategories[category];
      return channelCount < MAX_CHANNEL_LIMIT;
    },
  );

  if (!availableCategoryName) {
    throw new Error(
      `Unable to find a non-full category ${JSON.stringify(request)}`,
    );
  }

  const [, communityCategory] = communityCategories[availableCategoryName];

  return await guild.channels.create(request.channelName, {
    type: 'text',
    topic: `Channel Admins: ${request.user}`,
    parent: communityCategory,
  });
};

export const isFromBotChannel = (message: DiscordMessageType) =>
  Boolean(
    message.guild?.channels.cache.some(
      ({ name, id }) =>
        name === BOT_COMMANDS_CHANNEL && id === message.channel.id,
    ),
  );

export const isFromCommunityChannel = (message: DiscordMessageType) =>
  fetchCommunityChannels(message.guild).some(
    ({ channel }) => channel.id === message.channel.id,
  );

// For the time being we use channel topics as the source of truth for who channel admins are.
// Eventually we'll migrate to some datastore in order for channel admins to use channel topics
// as a medium of communication to channel members.
export const fetchChannelAdmins = (channel: TextChannel) =>
  Boolean(channel.topic)
    ? (channel.topic?.split(':')[1] || '')
        .split(',')
        .map((user) => user.trim())
        .filter(Boolean)
    : [];

export const fetchCommunityChannels = (
  guild: Maybe<Guild>,
): ChannelListType[] =>
  guild?.channels.cache
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

      return categoryName.startsWith(COMMUNITY_CATEGORY_PREFIX);
    })
    .map((channel) => ({
      name: channel.name,
      // TODO (joey.colon): `user_count` is currently inaccurate. Since we use Discord overrides to assign members to channels,
      // typical `members.size` returns only the count of admins online in each channel and not accurate total users.
      // Investigate other methods of determining user count.
      user_count: channel.members.size,
      channel: channel,
    }))
    .filter(
      (channel) => !INVALID_CHANNEL_NAMES.has(stripChannelName(channel.name)),
    )
    .sort((a, b) => (a.name > b.name ? 1 : -1)) || [];

export const stripChannelName = (input: string) =>
  input.replace('#', '').replace(/ /g, '_').toLowerCase();
