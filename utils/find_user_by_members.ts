import { GuildMemberManager, GuildMember, MessageMentions } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
import { pipe, constant } from 'fp-ts/function';
import * as R from 'ramda';

const findUserByMembers = (idOrMention: string) => (members: GuildMemberManager) =>
  R.cond<[string], TaskOption.TaskOption<GuildMember>>([
    [
      (str) => MessageMentions.UsersPattern.test(str),
      (str) =>
        pipe(
          MessageMentions.UsersPattern.exec(str),
          (resolve) => resolve?.at(1) || '',
          (id) => TaskOption.tryCatch(() => members.fetch(id))
        ),
    ],
    [R.T, (id) => TaskOption.tryCatch(() => members.fetch(id))],
  ])(idOrMention);

export default findUserByMembers;
