// Example Plugin - Copy this and modify to create new commands

const handler = async (m, sock, { from, text, args, cmd, isGroup, prefix }) => {
  // m = message object
  // sock = whatsapp socket
  // from = message sender JID
  // text = full message text
  // args = command arguments (array)
  // cmd = command name
  // isGroup = boolean (true if group chat)
  // prefix = command prefix ('.' or '/')

  // Your plugin code here
  await sock.sendMessage(from, { 
    text: `✅ Command executed: ${cmd}\nArguments: ${args.join(', ') || 'none'}`
  });
};

handler.command = 'example'; // Single command
// handler.command = ['example', 'ex']; // Multiple commands
handler.tags = ['general']; // Plugin category
handler.help = 'Example plugin - demonstrates basic structure';

export default handler;
