const handler = async (m, sock, { from, chat }) => {
  const menu = `
╔═══════════════════╗
║    🤖 WASI-MD     ║
╚═══════════════════╝

📋 *Available Commands:*

🔧 *General*
• .menu - Show this menu
• .ping - Check bot status
• .info - Bot information

🎨 *Media*
• .sticker - Convert image to sticker (reply to image)

🌐 *API & Tools*
• .api <url> - Fetch data from API

📝 *Usage:* .command
🔗 *Prefix:* .

━━━━━━━━━━━━━━━━━
*Version:* 1.0.0
  `;
  
  await sock.sendMessage(chat, { text: menu });
};

handler.command = ['menu', 'help', 'start'];
handler.tags = ['general'];
handler.help = 'Show available commands';

export default handler;
