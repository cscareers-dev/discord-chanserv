import { DiscordMessageType } from '../app/messages';
import SegmentClient from 'analytics-node';
import { TextChannel } from 'discord.js';

type EventType = 'bot_command_event' | 'community_message_event';
export const BOT_COMMAND_EVENT = 'bot_command_event';
export const COMMUNITY_MESSAGE_EVENT = 'community_message_event';

export class Analytics {
  private _client;

  constructor(token: string) {
    this._client = new SegmentClient(token);
  }

  async emit(message: DiscordMessageType, event: EventType, properties?: any) {
    const identifyUser = new Promise((resolve, reject) => {
      this._client.identify(
        {
          userId: message.author.id,
          timestamp: new Date(),
          traits: {
            name: message.author.tag,
          },
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        },
      );
    });

    const trackEvent = new Promise((resolve, reject) => {
      this._client.track(
        {
          userId: message.author.id,
          event: event,
          timestamp: new Date(),
          properties: {
            ...(properties ? { ...properties } : {}),
            channel: (message.channel as TextChannel).name,
          },
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        },
      );
    });

    await Promise.all([identifyUser, trackEvent]);
  }
}
