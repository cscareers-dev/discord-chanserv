import { TextChannel } from 'discord.js';
import Logger from '../../util/logger';
import { fetchChannelAdmins, isFromCommunityChannel } from '../channels';
import { MessagePayloadType } from '../messages';
import { fetchUser } from '../users';

export default async function kick(payload: MessagePayloadType) {
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
