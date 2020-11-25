import { TextChannel } from 'discord.js';
import { fetchChannelAdmins, isFromCommunityChannel } from '../channels';
import { MessagePayloadType } from '../messages';
import { fetchUser } from '../users';

export default async function promote(payload: MessagePayloadType) {
  if (!isFromCommunityChannel(payload.source)) {
    return;
  }

  // Currently only admins are allowed to promote a user to channel admin.
  const isAdmin = Boolean(
    payload.source.member?.hasPermission('ADMINISTRATOR'),
  );
  if (!isAdmin) {
    await payload.source.reply('Insufficient permissions');
    return;
  }

  const user = payload.source.content.split(' ').slice(1).join(' ');
  if (!user) {
    await payload.source.reply('Invalid usage: `!promote user#1234`');
    return;
  }

  const isValidUser = Boolean(fetchUser(user, payload.source.guild));
  if (!isValidUser) {
    await payload.source.reply(
      `Invalid username (case sensitive): \`${user}\``,
    );
    return;
  }

  const channel = payload.source.channel as TextChannel;
  const channelAdmins = fetchChannelAdmins(channel);

  await channel.setTopic(
    `Channel Admins: ${[...channelAdmins, user].join(', ')}`,
  );

  await payload.source.reply(`Successfully promoted ${user} to channel admin`);
}
