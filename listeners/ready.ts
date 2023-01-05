import { Client, ActivityType } from 'discord.js';

interface ReadyListener {
  (c: Client<true>): void;
}

const readyListener: ReadyListener = (client) => {
  client.user.setActivity('你的py', { type: ActivityType.Watching });

  console.log('ws ready');
};


export default readyListener