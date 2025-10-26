const handler = async (m, sock, { from, chat }) => {
  await sock.sendMessage(chat, { text: '🏓 Pong! Bot is online and working!' });
};

handler.command = 'ping';
handler.tags = ['general'];
handler.help = 'Check if bot is online';

export default handler;
