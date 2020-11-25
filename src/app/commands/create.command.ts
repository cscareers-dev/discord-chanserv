import { MessageReaction, TextChannel } from 'discord.js';
import Logger from '../../util/logger';
import { Maybe } from '../../util/types';
import {
  BOT_COMMANDS_CHANNEL,
  ChannelRequestType,
  createChannel,
  fetchCommunityChannels,
  isFromBotChannel,
  stripChannelName,
} from '../channels';
import { MessagePayloadType } from '../messages';

const PENDING_COMMUNITY_CHANNELS = 'pending_community_channels';

export default async function create(payload: MessagePayloadType) {
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

      if (reaction?.emoji.name === '👍') {
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
