import { detectMediaType, downloadMedia } from '../lib/helper.js';

const handler = async (m, sock, { from, chat }) => {
  const mediaType = detectMediaType(m);
  
  if (!mediaType || (mediaType.type !== 'image' && mediaType.type !== 'video')) {
    return await sock.sendMessage(chat, { 
      text: '❌ Please reply to an image or video to convert to sticker' 
    });
  }

  try {
    await sock.sendMessage(chat, { text: '⏳ Creating sticker...' });
    
    // Download the media
    const buffer = await downloadMedia(m, sock);
    
    // Send as sticker
    await sock.sendMessage(chat, {
      sticker: buffer,
      mimetype: mediaType.mime
    });
    
    await sock.sendMessage(chat, { text: '✅ Sticker created successfully!' });
  } catch (error) {
    console.error('Sticker error:', error);
    await sock.sendMessage(chat, { text: '❌ Error creating sticker. Please try again.' });
  }
};

handler.command = 'sticker';
handler.tags = ['media'];
handler.help = 'Convert image to sticker (reply to image)';

export default handler;
