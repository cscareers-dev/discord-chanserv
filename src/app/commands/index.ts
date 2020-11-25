import { MessagePayloadType } from '../messages';
import channels from './channels.command';
import join from './join.command';
import leave from './leave.command';
import create from './create.command';
import invite from './invite.command';
import help from './help.command';
import promote from './promote.command';
import demote from './demote.command';
import highlight from './highlight.command';
import kick from './kick.command';

type CommandsType = {
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

export default {
  channels,
  join,
  leave,
  create,
  invite,
  help,
  promote,
  demote,
  highlight,
  kick,
} as CommandsType;
