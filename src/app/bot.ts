import Logger from '../util/logger';
import Environment from '../environment';
import { Client } from 'discord.js';
import { adaptMessage, DiscordMessageType, handleMessage } from './messages';

async function run() {
  if (!Environment.DiscordToken) {
    throw new Error('Unable to locate Discord token');
  }

  const discordClient = new Client({
    presence: { activity: { name: 'vibing' } },
  });

  discordClient
    .login(Environment.DiscordToken)
    .then(() => Logger.info('cscareers chanserv is now running!'))
    .catch(Logger.error);

  discordClient.on('message', async (message: DiscordMessageType) => {
    if (message.author.bot) {
      return;
    }

    const payload = adaptMessage(message);
    await handleMessage(payload);
  });
}

const Bot = { run };

export default Bot;
