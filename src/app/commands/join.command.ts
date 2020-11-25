import Logger from '../../util/logger';
import {
  BOT_COMMANDS_CHANNEL,
  fetchCommunityChannels,
  isFromBotChannel,
  stripChannelName,
} from '../channels';
import { MessagePayloadType } from '../messages';

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
