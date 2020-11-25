import { TextChannel } from 'discord.js';
import { fetchChannelAdmins, isFromCommunityChannel } from '../channels';
import { MessagePayloadType } from '../messages';

export default async function highlight(payload: MessagePayloadType) {
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
