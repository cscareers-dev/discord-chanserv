import { Guild, GuildChannel, Snowflake, TextChannel } from 'discord.js';
import Logger from '../util/logger';
import { Maybe } from '../util/types';
import { DiscordMessageType, MessagePayloadType } from './messages';

type CommandStoreType = {
  list: (payload: MessagePayloadType) => Promise<void>;
  join: (payload: MessagePayloadType) => Promise<void>;
  leave: (payload: MessagePayloadType) => Promise<void>;
  create: (payload: MessagePayloadType) => Promise<void>;
  invite: (payload: MessagePayloadType) => Promise<void>;
  help: (payload: MessagePayloadType) => Promise<void>;
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

const fetchUser = (username: string, guild: Maybe<Guild>): Maybe<Snowflake> =>
  guild?.members.cache.find((member) => username === member.user.tag)?.user.id;

const fetchChannelAdmins = (channel: TextChannel) => {
  // For the time being we use channel topics as the source of truth for who channel admins are.
  // Eventually we'll migrate to some datastore in order for channel admins to use channel topics
  // as a medium of communication to channel members.
  if (!channel.topic) {
    return [];
  }

  const [, users] = channel.topic.split(':') || [];
  if (!users) {
    return [];
  }

  return users.split(',').map((user) => user.trim());
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
    .map((channel) => ({
      name: channel.name,
      user_count: channel.permissionOverwrites.filter(
        (permission) => permission.type === 'member',
      ).size,
      channel: channel,
    }))
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
      `Please run this command in the #${BOT_COMMANDS_CHANNEL} channel`,
    );
    return;
  }

  const channel = payload.args.join('_');
  if (!channel) {
    await payload.source.reply('Invalid usage: `!join channel_name`');
    return;
  }

  const strippedChannelName = stripChannelName(channel);
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
    .then(async () => await payload.source.reply('Successfully join channel'))
    .catch(async (error) => {
      Logger.error(error);
      await payload.source.reply('Unable to join this channel :(');
    });
}

async function leave(payload: MessagePayloadType) {
  if (!isFromBotChannel(payload.source)) {
    await payload.source.reply(
      `Please run this command in the #${BOT_COMMANDS_CHANNEL} channel`,
    );
    return;
  }

  const channel = payload.args.join('_');
  if (!channel) {
    await payload.source.reply('Invalid usage: `!leave channel_name`');
    return;
  }

  const strippedChannelName = stripChannelName(channel);
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

async function invite(payload: MessagePayloadType) {
  const communityChannels = fetchCommunityChannels(payload.source.guild);
  const currentChannelId = payload.source.channel.id;
  const currentChannel = communityChannels.find(
    ({ channel }) => channel.id === currentChannelId,
  );
  const isFromCommunityChannel = Boolean(currentChannel);
  if (!isFromCommunityChannel) {
    return;
  }

  const channelAdmins = fetchChannelAdmins(
    payload.source.channel as TextChannel,
  );
  const canInvite =
    payload.source.member.hasPermission('ADMINISTRATOR') ||
    channelAdmins.includes(payload.source.author.tag);

  if (!canInvite) {
    await payload.source.reply('Insufficient permissions');
    return;
  }

  const user = payload.args.join(' ');
  if (!user) {
    await payload.source.reply('Invalid usage: `!invite user#1234`');
    return;
  }

  const targetUser = fetchUser(user, payload.source.guild);
  if (!targetUser) {
    await payload.source.reply(`Unable to resolve \`${user}\``);
    return;
  }

  await currentChannel.channel
    .updateOverwrite(targetUser, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      READ_MESSAGE_HISTORY: true,
    })
    .then(
      async () => await payload.source.reply(`Successfully invited ${user}`),
    )
    .catch(async (error) => {
      Logger.error(error);
      await payload.source.reply('Unable to leave channel :(');
    });
}

async function help(payload: MessagePayloadType) {
  await payload.source.reply(`**Available Commands:**
\`\`\`
!list - Lists available community channels
!join channel_anme - Joins community channel
!leave channel_name - Leaves community channel
!create channel_name - Creates community channel
!invite user#1234 - Invites user to community channel
\`\`\`
    `);
}

const CommandStore: CommandStoreType = {
  list,
  join,
  leave,
  create,
  invite,
  help,
};

export default Object.freeze(CommandStore);
