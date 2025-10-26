import { getSessionInfo, generatePairingCode } from '../lib/session.js';
import config from '../config.js';

const handler = async (m, sock, { from, chat, args, cmd }) => {
  const subCmd = args[0]?.toLowerCase();

  if (subCmd === 'generate' || subCmd === 'gen') {
    // Generate pairing code
    const pairingCode = generatePairingCode();
    
    await sock.sendMessage(chat, {
      text: `🔐 *Pairing Code Generated*\n\n📱 *Code:* ${pairingCode}\n\n💡 *How to use:*\n1. On your WhatsApp, go to Settings\n2. Click "Linked Devices"\n3. Click "Link a Device"\n4. Select "Link with Phone Number Instead"\n5. Enter this code: ${pairingCode}\n\n⏱️ *Expires in:* 60 seconds`
    });
    
    return;
  }

  if (subCmd === 'base64' || subCmd === 'b64') {
    // Show current session base64
    const sessionInfo = await getSessionInfo();
    
    if (!sessionInfo.hasSession) {
      return await sock.sendMessage(chat, {
        text: '❌ No active session found. Please connect first.'
      });
    }

    // Truncate for display
    const truncatedB64 = sessionInfo.sessionBase64.substring(0, 200) + '...';
    
    await sock.sendMessage(chat, {
      text: `📦 *Session Base64*\n\n\`\`\`\n${truncatedB64}\n\`\`\`\n\n💡 *Full Base64:*\n${sessionInfo.sessionBase64}\n\n⚠️ *Keep this secure!*`
    });
    
    return;
  }

  if (subCmd === 'id') {
    // Show session ID
    const sessionInfo = await getSessionInfo();
    
    if (!sessionInfo.hasSession) {
      return await sock.sendMessage(chat, {
        text: '❌ No active session found. Please connect first.'
      });
    }

    await sock.sendMessage(chat, {
      text: `🆔 *Session ID*\n\n\`\`\`\n${sessionInfo.sessionId}\n\`\`\`\n\n💡 *Use this to restore your session*`
    });
    
    return;
  }

  if (subCmd === 'info' || !subCmd) {
    // Show all session information
    const sessionInfo = await getSessionInfo();
    
    const info = `
🔐 *Session Information*

📊 *Connection Status:* ${sessionInfo.hasSession ? '✅ Connected' : '❌ Not Connected'}
🆔 *Session ID:* ${sessionInfo.hasSession ? '✓ Available' : '✗ Not Available'}
📦 *Session Base64:* ${sessionInfo.hasSession ? '✓ Available' : '✗ Not Available'}
🔗 *Connection Method:* ${config.pairingCode ? 'Pairing Code' : 'QR Code'}

💡 *Commands:*
• \`.sessioninfo id\` - Get Session ID
• \`.sessioninfo base64\` - Get Session Base64
• \`.sessioninfo generate\` - Generate Pairing Code

⚠️ *Keep your session data secure!*
    `.trim();
    
    await sock.sendMessage(chat, { text: info });
    return;
  }

  // Help
  await sock.sendMessage(chat, {
    text: `🔐 *Session Management*\n\n*Commands:*\n• \`.sessioninfo\` - Show session info\n• \`.sessioninfo id\` - Get Session ID\n• \`.sessioninfo base64\` - Get Session Base64\n• \`.sessioninfo generate\` - Generate Pairing Code`
  });
};

handler.command = ['sessioninfo', 'sinfo', 'session'];
handler.tags = ['tools'];
handler.help = 'Manage and view session information';

export default handler;
