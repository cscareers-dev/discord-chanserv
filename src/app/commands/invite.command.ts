import { TextChannel } from 'discord.js';
import Logger from '../../util/logger';
import { fetchChannelAdmins, isFromCommunityChannel } from '../channels';
import { MessagePayloadType } from '../messages';
import { fetchUser } from '../users';

export default async function invite(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);
  const canInvite =
    Boolean(payload.source.member?.hasPermission('ADMINISTRATOR')) ||
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
