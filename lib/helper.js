import { downloadMediaMessage, proto } from '@whiskeysockets/baileys';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create tmp directory if it doesn't exist
const tmpDir = path.join(__dirname, '..', 'tmp');
try {
  await fs.mkdir(tmpDir, { recursive: true });
} catch (err) {}

/**
 * Download media and return buffer
 */
export async function downloadMedia(msg, sock) {
  try {
    if (!msg || !msg.message) {
      throw new Error('Invalid message');
    }

    // Download media buffer
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: console.log,
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    return buffer;
  } catch (error) {
    console.error('Error downloading media:', error);
    throw error;
  }
}

/**
 * Detect media type from message
 */
export function detectMediaType(msg) {
  if (!msg || !msg.message) return null;

  const message = msg.message;
  
  if (message.audioMessage) {
    return {
      type: 'audio',
      mime: message.audioMessage.mimetype || 'audio/ogg',
      seconds: message.audioMessage.seconds,
      ptt: message.audioMessage.ptt, // Voice message if true
      isVoice: true
    };
  }
  
  if (message.videoMessage) {
    return {
      type: 'video',
      mime: message.videoMessage.mimetype || 'video/mp4',
      seconds: message.videoMessage.seconds,
      caption: message.videoMessage.caption || ''
    };
  }
  
  if (message.imageMessage) {
    return {
      type: 'image',
      mime: message.imageMessage.mimetype || 'image/jpeg',
      caption: message.imageMessage.caption || ''
    };
  }
  
  if (message.documentMessage) {
    const mimetype = message.documentMessage.mimetype || '';
    const fileName = message.documentMessage.fileName || 'document';
    
    return {
      type: 'document',
      mime: mimetype,
      fileName: fileName,
      caption: message.documentMessage.caption || ''
    };
  }
  
  if (message.stickerMessage) {
    return {
      type: 'sticker',
      mime: message.stickerMessage.mimetype || 'image/webp',
      isAnimated: message.stickerMessage.isAnimated || false
    };
  }
  
  return null;
}

/**
 * Save media buffer to file
 */
export async function saveMedia(buffer, type, extension = null) {
  if (!extension) {
    extension = getExtensionFromMime(type);
  }
  
  const timestamp = Date.now();
  const filename = `${timestamp}.${extension}`;
  const filepath = path.join(tmpDir, filename);
  
  await fs.writeFile(filepath, buffer);
  
  return { filepath, filename };
}

/**
 * Get file extension from mime type
 */
function getExtensionFromMime(mime) {
  const mimeMap = {
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'mp4',
    'audio/webm': 'webm',
    'audio/aac': 'aac',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/x-msvideo': 'avi',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt'
  };
  
  return mimeMap[mime] || 'bin';
}

/**
 * Check if message has media
 */
export function hasMedia(msg) {
  return detectMediaType(msg) !== null;
}

/**
 * Get media info
 */
export async function getMediaInfo(msg, sock) {
  const mediaType = detectMediaType(msg);
  
  if (!mediaType) {
    return null;
  }
  
  try {
    const buffer = await downloadMedia(msg, sock);
    const { filepath, filename } = await saveMedia(buffer, mediaType.mime);
    
    return {
      ...mediaType,
      buffer,
      filepath,
      filename,
      size: buffer.length
    };
  } catch (error) {
    console.error('Error getting media info:', error);
    return mediaType;
  }
}

/**
 * Clean up temporary files
 */
export async function cleanupTmp(files = []) {
  try {
    const filesToDelete = files.length > 0 ? files : await fs.readdir(tmpDir);
    
    for (const file of filesToDelete) {
      try {
        await fs.unlink(path.join(tmpDir, file));
      } catch (err) {
        // Ignore errors
      }
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}

/**
 * Clean up old files older than 1 hour
 */
export async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(tmpDir);
    const now = Date.now();
    
    for (const file of files) {
      try {
        const filepath = path.join(tmpDir, file);
        const stats = await fs.stat(filepath);
        const age = now - stats.mtimeMs;
        
        // Delete files older than 1 hour
        if (age > 3600000) {
          await fs.unlink(filepath);
        }
      } catch (err) {
        // Ignore errors
      }
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}

// Run cleanup every hour
setInterval(cleanupOldFiles, 3600000);
