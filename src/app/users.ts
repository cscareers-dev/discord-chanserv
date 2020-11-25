import { Guild, Snowflake } from 'discord.js';
import { Maybe } from '../util/types';

export const fetchUser = (
  username: string,
  guild: Maybe<Guild>,
): Maybe<Snowflake> =>
  guild?.members.cache.find((member) => username === member.user.tag)?.user.id;
