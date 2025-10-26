const handler = async (m, sock, { from, chat }) => {
  const info = `
📊 *WASI-MD Bot Information*

🤖 *Bot:* WASI-MD
📝 *Version:* 1.0.0
🔧 *Type:* Multi-Device WhatsApp Bot
⚡ *Status:* Online ✓
💬 *Total Plugins:* 5
  `;
  
  await sock.sendMessage(chat, { text: info });
};

handler.command = 'info';
handler.tags = ['general'];
handler.help = 'Show bot information';

export default handler;
