import { Guild, GuildChannel, TextChannel } from 'discord.js';
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

export const BOT_COMMANDS_CHANNEL = Constants.BotCommandsChannel;
export const COMMUNITY_CATEGORY = Constants.CommunityCategory;

export const createChannel = async (
  request: ChannelRequestType,
  guild: Maybe<Guild>,
) => {
  const communityCategory = guild?.channels.cache.find(
    (channel) => channel.name === COMMUNITY_CATEGORY,
  );
  if (!communityCategory) {
    throw new Error(
      `Unable to locate community category ${JSON.stringify(request)}`,
    );
  }

  await guild?.channels.create(request.channelName, {
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

      return categoryName === COMMUNITY_CATEGORY;
    })
    .map((channel) => ({
      name: channel.name,
      user_count: channel.permissionOverwrites.filter(
        (permission) => permission.type === 'member',
      ).size,
      channel: channel,
    }))
    .sort((a, b) => b.user_count - a.user_count) || [];

export const stripChannelName = (input: string) =>
  input.replace('#', '').replace(/ /g, '_').toLowerCase();
