import { CommandInteraction, GuildMember, RoleResolvable } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
import findUserByMembers from '../utils/find_user_by_members';
import { pipe } from 'fp-ts/function';

const addRoleFromMember = (roleId: RoleResolvable) => (member: GuildMember) =>
  TaskOption.tryCatch(() => member.roles.add(roleId));

const subscribe = (roleId: string) => (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  return pipe(
    interaction.guild
      ? TaskOption.of({
          members: interaction.guild.members,
          roles: interaction.guild.roles,
        })
      : TaskOption.none,

    // find and add member role
    TaskOption.tap(({ members }) =>
      pipe(members, findUserByMembers(userId), TaskOption.flatMap(addRoleFromMember(roleId)))
    ),

    // find role info
    TaskOption.flatMap(({ roles }) => TaskOption.tryCatch(() => roles.fetch(roleId))),

    TaskOption.flatMap((roleInfo) =>
      TaskOption.tryCatch(() =>
        interaction.reply({
          content: `您已成為 **${roleInfo?.name || ''}** 的一員`,
          fetchReply: true,
        })
      )
    )
  );
};

export default subscribe;
