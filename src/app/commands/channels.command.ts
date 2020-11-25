import { BOT_COMMANDS_CHANNEL, fetchCommunityChannels } from '../channels';
import { MessagePayloadType } from '../messages';

const MAX_MESSAGE_LENGTH = 1750;

export default async function channels(payload: MessagePayloadType) {
  const messages = fetchCommunityChannels(payload.source.guild)
    .map((channel) => `${channel.name} - ${channel.user_count} users\n`)
    .reduce(
      (acc: string[], channel) => {
        const idx = acc.length - 1;
        const lastMessage = acc[idx];
        if (lastMessage.length + channel.length >= MAX_MESSAGE_LENGTH) {
          acc.push(channel);
        } else {
          acc[idx] += channel;
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
