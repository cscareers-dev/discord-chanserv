import { TextChannel, User } from 'discord.js';
import Logger from '../../util/logger';
import { Maybe } from '../../util/types';
import {
  BOT_COMMANDS_CHANNEL,
  fetchCommunityChannels,
  INVALID_CHANNEL_NAMES,
  isFromBotChannel,
  stripChannelName,
} from '../channels';
import { MessagePayloadType } from '../messages';
import Fuse from 'fuse.js';

const JOIN_MESSAGES = [
  'Have no fear, {user} is here!',
  '{user} has entered the community.',
  '{user} has just slid into the community.',
  'Everyone say hello to {user}!',
  'Wow, {user} just joined! Who brought the cake?!',
  'FREEZE! {user} has entered the room.',
];

const generateJoinMessage = (user: User) =>
  JOIN_MESSAGES[Math.floor(Math.random() * JOIN_MESSAGES.length)].replace(
    '{user}',
    user.toString(),
  );

export default async function join(payload: MessagePayloadType) {
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
  if (INVALID_CHANNEL_NAMES.has(strippedChannelName)) {
    await payload.source.reply('Invalid channel name');
    return;
  }
  const communityChannels = fetchCommunityChannels(payload.source.guild);
  const targetChannel = communityChannels.find(
    ({ channel }) => stripChannelName(channel.name) === strippedChannelName,
  )?.channel as Maybe<TextChannel>;

  if (!targetChannel) {
    const fuse = new Fuse(
      communityChannels.map((channel) => channel.name),
      { includeScore: true },
    );

    const suggestedChannels = fuse
      .search(strippedChannelName)
      .filter((channel) => Boolean(channel.score))
      .map((channel) => channel.item);

    await payload.source.reply(`
      Unable to locate this channel
      Did you mean? \`${suggestedChannels.join(', ')}\`
    `);
    return;
  }

  await targetChannel
    .updateOverwrite(payload.source.author, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      READ_MESSAGE_HISTORY: true,
    })
    .then(async () => {
      await payload.source.react('✅');
      await targetChannel.send(generateJoinMessage(payload.source.author));
    })
    .catch(async (error) => {
      Logger.error(error);
      await payload.source.reply('Unable to join this channel :(');
    });
}
