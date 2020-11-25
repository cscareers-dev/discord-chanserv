import { MessagePayloadType } from './messages';
import Commands from './commands';

type CommandStoreType = {
  channels: (payload: MessagePayloadType) => Promise<void>;
  join: (payload: MessagePayloadType) => Promise<void>;
  leave: (payload: MessagePayloadType) => Promise<void>;
  create: (payload: MessagePayloadType) => Promise<void>;
  invite: (payload: MessagePayloadType) => Promise<void>;
  help: (payload: MessagePayloadType) => Promise<void>;
  promote: (payload: MessagePayloadType) => Promise<void>;
  demote: (payload: MessagePayloadType) => Promise<void>;
  highlight: (payload: MessagePayloadType) => Promise<void>;
  kick: (payload: MessagePayloadType) => Promise<void>;
};

const CommandStore: CommandStoreType = {
  ...Commands,
};

export default Object.freeze(CommandStore);
