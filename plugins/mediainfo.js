import { detectMediaType, getMediaInfo } from '../lib/helper.js';

const handler = async (m, sock, { from, chat }) => {
  const mediaType = detectMediaType(m);
  
  if (!mediaType) {
    return await sock.sendMessage(chat, {
      text: '❌ No media detected in this message. Reply to an image, video, audio, document, or sticker.'
    });
  }

  try {
    // Get detailed media info with buffer
    const mediaInfo = await getMediaInfo(m, sock);
    
    const info = `
📎 *Media Information*

📝 *Type:* ${mediaInfo.type.toUpperCase()}
📄 *MIME:* ${mediaInfo.mime}
${mediaInfo.fileName ? `📁 *File:* ${mediaInfo.fileName}` : ''}
${mediaInfo.size ? `💾 *Size:* ${(mediaInfo.size / 1024).toFixed(2)} KB` : ''}
${mediaInfo.seconds ? `⏱️ *Duration:* ${mediaInfo.seconds}s` : ''}
${mediaInfo.isVoice ? '🎤 *Voice Message* ✓' : ''}
${mediaInfo.isAnimated ? '🎬 *Animated* ✓' : ''}
${mediaInfo.caption ? `\n💬 *Caption:* ${mediaInfo.caption}` : ''}
    `.trim();
    
    await sock.sendMessage(chat, { text: info });
  } catch (error) {
    console.error('Media info error:', error);
    await sock.sendMessage(chat, {
      text: `❌ Error getting media information.\nType: ${mediaType.type}\nMIME: ${mediaType.mime}`
    });
  }
};

handler.command = ['mediainfo', 'minfo', 'mediadet'];
handler.tags = ['tools'];
handler.help = 'Get information about media (reply to media)';

export default handler;
