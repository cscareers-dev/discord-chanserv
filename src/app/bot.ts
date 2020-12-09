import Logger from '../util/logger';
import Environment from '../environment';
import { Client as DiscordClient, TextChannel } from 'discord.js';
import { adaptMessage, DiscordMessageType, handleMessage } from './messages';
import Constants from '../constants';
import { BOT_COMMANDS_CHANNEL, isFromCommunityChannel } from './channels';
import {
  BOT_COMMAND_EVENT,
  COMMUNITY_MESSAGE_EVENT,
  Analytics as AnalyticsClient,
} from '../util/analytics';

async function run() {
  if (!Environment.DiscordToken) {
    throw new Error('Unable to locate Discord token');
  }

  if (!Environment.SegmentToken) {
    throw new Error('Unable to locate Segment token');
  }

  const analyticsClient = new AnalyticsClient(Environment.SegmentToken);
  const discordClient = new DiscordClient({
    presence: {
      activity: {
        name: '!help',
        type: 'LISTENING',
      },
    },
  });

  discordClient
    .login(Environment.DiscordToken)
    .then(() => Logger.info('cscareers chanserv is now running!'))
    .catch(Logger.error);

  discordClient.on('message', async (message: DiscordMessageType) => {
    const isBotCommandEvent =
      !message.author.bot && message.content[0] === Constants.Prefix;
    const events = [];

    if (isBotCommandEvent) {
      const payload = adaptMessage(message);
      const channelName = (message.channel as TextChannel).name;
      events.push(
        ...[
          handleMessage(payload),
          channelName === BOT_COMMANDS_CHANNEL
            ? analyticsClient.emit(message, BOT_COMMAND_EVENT, {
                command: payload.command,
                args: payload.args,
              })
            : null,
        ],
      );
    } else if (isFromCommunityChannel(message)) {
      events.push(analyticsClient.emit(message, COMMUNITY_MESSAGE_EVENT));
    }

    await Promise.all(events);
  });
}

const Bot = { run };

export default Bot;
