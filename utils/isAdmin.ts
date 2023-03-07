import { PermissionFlagsBits, GuildMember } from 'discord.js';

function isAdmin(member: GuildMember) {
  return member.permissions.has(PermissionFlagsBits.Administrator) || false;
}

export default isAdmin;
