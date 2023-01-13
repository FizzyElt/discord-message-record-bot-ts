import { Client, ActivityType } from 'discord.js';

function readyListener(client: Client<true>): void {
  client.user.setActivity('你的py', { type: ActivityType.Watching });

  console.log('ws ready');
}

export default readyListener;
