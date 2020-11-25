import { Message } from 'discord.js';
import CommandStore from './command.store';
import Logger from '../util/logger';

export type DiscordMessageType = Message;

export type MessagePayloadType = {
  readonly command: string;
  readonly args: string[];
  readonly source: DiscordMessageType;
};

export const adaptMessage = (
  message: DiscordMessageType,
): MessagePayloadType => {
  const [command, ...args] = message.content
    .split(' ')
    .map((token) => token.toLowerCase());

  return {
    command: command.substring(1),
    args: args,
    source: message,
  };
};

export const handleMessage = async (payload: MessagePayloadType) => {
  const fn = CommandStore.get(payload.command);
  if (!fn) {
    return;
  }
  await fn(payload).catch(Logger.error);
};
