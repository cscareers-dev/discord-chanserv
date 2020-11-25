import { MessagePayloadType } from './messages';
import commands from './commands';

type CommandStoreType = Map<
  string,
  (payload: MessagePayloadType) => Promise<void>
>;

// TODO (joey.colon): Look into transferring into an immutable map.
const CommandStore: CommandStoreType = new Map(Object.entries(commands));

export default CommandStore;
