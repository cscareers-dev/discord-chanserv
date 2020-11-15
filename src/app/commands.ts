import Logger from '../util/logger';

type CommandStoreType = {
  list: () => Promise<void>;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  create: () => Promise<void>;
};

async function list() {
  Logger.info('list cmd');
}

async function register() {
  Logger.info('register cmd');
}

async function unregister() {
  Logger.info('unregister cmd');
}

async function create() {
  Logger.info('create cmd');
}

const CommandStore: CommandStoreType = {
  list,
  register,
  unregister,
  create,
};

export default Object.freeze(CommandStore);
