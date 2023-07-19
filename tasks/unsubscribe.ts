import { CommandInteraction, GuildMember, RoleResolvable } from 'discord.js';
import * as TaskOption from 'fp-ts/TaskOption';
import findUserByMembers from '../utils/find_user_by_members';
import { pipe } from 'fp-ts/function';

const removeRoleFromMember = (roleId: RoleResolvable) => (member: GuildMember) =>
  TaskOption.tryCatch(() => member.roles.remove(roleId));

const unsubscribe = (roleId: string) => (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  return pipe(
    interaction.guild
      ? TaskOption.of({
          members: interaction.guild.members,
          roles: interaction.guild.roles,
        })
      : TaskOption.none,

    // find and remove member role
    TaskOption.tap(({ members }) =>
      pipe(
        members,
        findUserByMembers(userId),
        TaskOption.flatMap(removeRoleFromMember('1131232608810962984'))
      )
    ),

    // find role info
    TaskOption.flatMap(({ roles }) =>
      TaskOption.tryCatch(() => roles.fetch('1131232608810962984'))
    ),
    TaskOption.flatMap((roleInfo) =>
      TaskOption.tryCatch(() =>
        interaction.reply({
          content: `您已退出 **${roleInfo?.name || ''}**`,
          fetchReply: true,
        })
      )
    )
  );
};

export default unsubscribe;
