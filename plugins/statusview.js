// Auto view status plugin - requires automations variable from index.js
let statusViewEnabled = false;

const handler = async (m, sock, { from, chat, text, args, cmd, automations }) => {
  const subCmd = args[0]?.toLowerCase();

  // Toggle status view
  if (subCmd === 'on' || subCmd === 'enable') {
    automations.statusView = true;
    statusViewEnabled = true;
    await sock.sendMessage(chat, {
      text: '✅ *Status View Auto-Mode Enabled*\n\nNow automatically viewing all status updates.'
    });
    
    return;
  }

  if (subCmd === 'off' || subCmd === 'disable') {
    automations.statusView = false;
    statusViewEnabled = false;
    await sock.sendMessage(chat, {
      text: '❌ *Status View Auto-Mode Disabled*\n\nNo longer viewing status updates automatically.'
    });
    return;
  }

  if (subCmd === 'status' || subCmd === 'check') {
    await sock.sendMessage(chat, {
      text: `📊 *Status View Status:*\n\n${automations.statusView ? '✅ Enabled' : '❌ Disabled'}`
    });
    return;
  }

  // Help message
  await sock.sendMessage(chat, {
    text: `📱 *Status View Automation*\n\n*Usage:*\n• \`.statusview on\` - Enable auto-view\n• \`.statusview off\` - Disable auto-view\n• \`.statusview status\` - Check current status\n\n*Current:* ${automations.statusView ? '✅ Enabled' : '❌ Disabled'}`
  });
};

handler.command = ['statusview', 'stview', 'autostatus'];
handler.tags = ['tools'];
handler.help = 'Automatically view WhatsApp status updates';

// Export for status view checking
export { statusViewEnabled };

export default handler;
