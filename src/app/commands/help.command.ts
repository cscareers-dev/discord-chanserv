import { MessagePayloadType } from '../messages';

export default async function help(payload: MessagePayloadType) {
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
