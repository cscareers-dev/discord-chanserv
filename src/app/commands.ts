import {
  Guild,
  GuildChannel,
  MessageReaction,
  Snowflake,
  TextChannel,
} from 'discord.js';
import Logger from '../util/logger';
import { Maybe } from '../util/types';
import { DiscordMessageType, MessagePayloadType } from './messages';

type CommandStoreType = {
  channels: (payload: MessagePayloadType) => Promise<void>;
  join: (payload: MessagePayloadType) => Promise<void>;
  leave: (payload: MessagePayloadType) => Promise<void>;
  create: (payload: MessagePayloadType) => Promise<void>;
  invite: (payload: MessagePayloadType) => Promise<void>;
  help: (payload: MessagePayloadType) => Promise<void>;
  promote: (payload: MessagePayloadType) => Promise<void>;
  demote: (payload: MessagePayloadType) => Promise<void>;
  highlight: (payload: MessagePayloadType) => Promise<void>;
  kick: (payload: MessagePayloadType) => Promise<void>;
};

type ChannelRequestType = {
  user: string;
  channelName: string;
};

type ChannelListType = {
  readonly name: string;
  readonly user_count: number;
  readonly channel: GuildChannel;
};

const COMMUNITY_CATEGORY = 'community channels';
const BOT_COMMANDS_CHANNEL = 'bot_commands';
const PENDING_COMMUNITY_CHANNELS = 'pending_community_channels';
const MAX_MESSAGE_LENGTH = 1750;

const createChannel = async (request: ChannelRequestType, guild: Guild) => {
  const communityCategory = guild.channels.cache.find(
    (channel) => channel.name === COMMUNITY_CATEGORY,
  );
  if (!communityCategory) {
    throw new Error(
      `Unable to locate community category ${JSON.stringify(request)}`,
    );
  }

  await guild.channels.create(request.channelName, {
    type: 'text',
    topic: `Channel Admins: ${request.user}`,
    parent: communityCategory,
  });
};

const isFromBotChannel = (message: DiscordMessageType) =>
  message.guild.channels.cache.some(
    ({ name, id }) =>
      name === BOT_COMMANDS_CHANNEL && id === message.channel.id,
  );

const isFromCommunityChannel = (message: DiscordMessageType) =>
  fetchCommunityChannels(message.guild).some(
    ({ channel }) => channel.id === message.channel.id,
  );

const fetchUser = (username: string, guild: Maybe<Guild>): Maybe<Snowflake> =>
  guild?.members.cache.find((member) => username === member.user.tag)?.user.id;

// For the time being we use channel topics as the source of truth for who channel admins are.
// Eventually we'll migrate to some datastore in order for channel admins to use channel topics
// as a medium of communication to channel members.
const fetchChannelAdmins = (channel: TextChannel) =>
  Boolean(channel.topic)
    ? (channel.topic.split(':')[1] || '')
        .split(',')
        .map((user) => user.trim())
        .filter(Boolean)
    : [];

const fetchCommunityChannels = (guild: Maybe<Guild>): ChannelListType[] =>
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

const stripChannelName = (input: string) =>
  input.replace('#', '').replace(/ /g, '_').toLowerCase();

async function channels(payload: MessagePayloadType) {
  const communityChannels = fetchCommunityChannels(payload.source.guild).map(
    (channel) => `${channel.name} - ${channel.user_count} users\n`,
  );

  const messages = communityChannels.reduce(
    (acc: string[], channel) => {
      const lastMessage = acc[acc.length - 1];
      if (lastMessage.length + channel.length >= MAX_MESSAGE_LENGTH) {
        acc.push(channel);
      } else {
        acc[acc.length - 1] += channel;
      }
      return acc;
    },
    ['**Available Channels:**\n'],
  );

  let shouldSendInChannel = false;
  for (const message of messages) {
    try {
      // We initially try sending these messages via DMs but a user can have their DMs disabled.
      await payload.source.author.send(message);
    } catch {
      shouldSendInChannel = true;
      break;
    }
  }

  if (shouldSendInChannel) {
    for (const message of messages) {
      await payload.source.reply(message);
    }
  }

  const createChannelMessage = `Create your own channel via \`!create channel_name\` in #${BOT_COMMANDS_CHANNEL}`;

  shouldSendInChannel
    ? await payload.source.reply(createChannelMessage)
    : await payload.source.author.send(createChannelMessage);
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

async function create(payload: MessagePayloadType) {
  if (!isFromBotChannel(payload.source) || !payload.source.guild) {
    await payload.source.reply(
      `Please run this command in the #${BOT_COMMANDS_CHANNEL} channel`,
    );
    return;
  }

  const communityChannels = fetchCommunityChannels(payload.source.guild);
  const requestedChannelName = stripChannelName(
    payload.args.map((segment) => segment.toLowerCase()).join('_'),
  );
  const channelExists = Boolean(
    communityChannels.some(
      (channel) => stripChannelName(channel.name) === requestedChannelName,
    ) || payload.source.mentions.channels.size,
  );

  if (channelExists) {
    await payload.source.reply('This channel already exists');
    return;
  }

  const pendingChannel = payload.source.guild.channels.cache.find(
    (channel) => channel.name === PENDING_COMMUNITY_CHANNELS,
  ) as Maybe<TextChannel>;

  if (!pendingChannel) {
    await payload.source.reply('Channel requests are currently disabled.');
    return;
  }

  await payload.source.reply(
    'Your request has been submitted to the admins. We will contact you with next steps :)',
  );

  const channelRequest: ChannelRequestType = {
    user: payload.source.author.tag,
    channelName: requestedChannelName,
  };

  const pendingSubmission = await pendingChannel.send(
    JSON.stringify(channelRequest, null, 2),
  );

  await pendingSubmission
    .awaitReactions(
      (reaction: MessageReaction) =>
        ['👍', '👎'].includes(reaction.emoji.name) &&
        reaction.message.id === pendingSubmission.id,
      { max: 1, time: 86400000, errors: ['time'] },
    )
    .then(async (response) => {
      const reaction = response.first();

      if (reaction.emoji.name === '👍') {
        await createChannel(channelRequest, payload.source.guild);
        await payload.source.reply('🥳🥳 Your channel has been approved!');
      } else {
        await payload.source.reply(
          'Your channel has been not been approved. Contact admins for further explanation.',
        );
      }
    })
    .catch(Logger.error);
}

async function invite(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);
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

  await channel
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
!channels - Lists available community channels
!join channel_anme - Joins community channel
!leave channel_name - Leaves community channel
!create channel_name - Creates community channel
!invite user#1234 - Invites user to community channel
\`\`\`
    `);
}

async function promote(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  // Currently only admins are allowed to promote a user to channel admin.
  const isAdmin = payload.source.member.hasPermission('ADMINISTRATOR');
  if (!isAdmin) {
    await payload.source.reply('Insufficient permissions');
    return;
  }

  const user = payload.args.join(' ');
  if (!user) {
    await payload.source.reply('Invalid usage: `!promote user#1234`');
    return;
  }

  const isValidUser = Boolean(fetchUser(user, payload.source.guild));
  if (!isValidUser) {
    await payload.source.reply(`Invalid username: \`${user}\``);
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);

  await channel.setTopic(
    `Channel Admins: ${[...channelAdmins, user].join(', ')}`,
  );

  await payload.source.reply(`Successfully promoted ${user} to channel admin`);
}

async function demote(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  // Currently only admins are allowed to demote a user.
  const isAdmin = payload.source.member.hasPermission('ADMINISTRATOR');
  if (!isAdmin) {
    await payload.source.reply('Insufficient permissions');
    return;
  }

  const user = payload.args.join(' ');
  if (!user) {
    await payload.source.reply('Invalid usage: `!demote user#1234`');
    return;
  }

  const isValidUser = Boolean(fetchUser(user, payload.source.guild));
  if (!isValidUser) {
    await payload.source.reply(`Invalid username: \`${user}\``);
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);

  if (!channelAdmins.includes(user)) {
    await payload.source.reply(`${user} is not a channel admin`);
    return;
  }

  await channel.setTopic(
    `Channel Admins: ${channelAdmins
      .filter((channelAdmin) => channelAdmin !== user)
      .join(', ')}`,
  );

  await payload.source.reply(`Successfully demoted ${user}`);
}

async function highlight(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);
  const hasPermission =
    payload.source.member.hasPermission('ADMINISTRATOR') ||
    channelAdmins.includes(payload.source.author.tag);

  if (!hasPermission) {
    await payload.source.reply('Insufficient permissions');
    return;
  }

  await payload.source.channel.send('@here');
}

async function kick(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);
  const hasPermission =
    payload.source.member.hasPermission('ADMINISTRATOR') ||
    channelAdmins.includes(payload.source.author.tag);

  if (!hasPermission) {
    await payload.source.reply('Insufficient permissions');
    return;
  }

  const user = payload.args.join(' ');
  if (!user) {
    await payload.source.reply('Invalid usage: `!kick user#1234`');
    return;
  }

  const targetUser = fetchUser(user, payload.source.guild);
  const isValidUser = Boolean(targetUser);
  if (!isValidUser) {
    await payload.source.reply(`Invalid username: \`${user}\``);
    return;
  }

  await channel
    .updateOverwrite(targetUser, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
      READ_MESSAGE_HISTORY: false,
    })
    .then(async () => await payload.source.reply(`Successfully kicked ${user}`))
    .catch(async (error) => {
      Logger.error(error);
      await payload.source.reply('Unable to kick user');
    });
}

const CommandStore: CommandStoreType = {
  channels,
  join,
  leave,
  create,
  invite,
  help,
  promote,
  demote,
  highlight,
  kick,
};

export default Object.freeze(CommandStore);
