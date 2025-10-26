// WASI-MD - Simple and Lightweight Multi-Device WhatsApp Bot
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import express from 'express';
import dotenv from 'dotenv';
import config from './config.js';
import { detectMediaType, hasMedia, getMediaInfo } from './lib/helper.js';
import { saveSessionFromBase64, getSessionInfo } from './lib/session.js';

dotenv.config();

const logger = pino({ level: 'silent' });
const app = express();

// Simple data storage
const db = {
  users: {},
  chats: {},
  settings: {}
};

// Store instance
const store = {
  chats: {},
  contacts: {},
  messages: []
};

// Automation settings
let automations = {
  statusView: false,
  autoReply: false,
  readReceipts: true
};

// Plugin loader
import { fileURLToPath } from 'url';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const plugins = new Map();

async function loadPlugins() {
  try {
    const files = await readdir('./plugins');
    for (const file of files) {
      if (file.endsWith('.js') && file !== '_example.js') {
        try {
          const plugin = await import(`./plugins/${file}?${Date.now()}`);
          const handler = plugin.default;
          
          if (handler && typeof handler === 'function') {
            const commands = Array.isArray(handler.command) ? handler.command : [handler.command];
            commands.forEach(cmd => {
              plugins.set(cmd, handler);
            });
            console.log(`✅ Loaded plugin: ${commands.join(',')}`);
          }
        } catch (err) {
          console.error(`❌ Error loading plugin ${file}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error loading plugins:', err.message);
  }
}

// Bot connection function
async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  
  const sock = makeWASocket({
    auth: state,
    logger,
    generateHighQualityLinkPreview: true,
  });

  // Handle QR code
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update;
    
    console.log('Connection update:', { connection, hasQR: !!qr, isNewLogin });
    
    if (qr) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 QR CODE GENERATED!');
      console.log('📱 Scan with WhatsApp Mobile:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');
      qrcode.generate(qr, { small: true });
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startSock(), 3000);
      } else {
        console.log('❌ Logged out. Session ended.');
      }
    } else if (connection === 'open') {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ BOT CONNECTED!');
      console.log('✅ Ready to receive messages');
      console.log('🤖 Send .menu to start using commands');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else if (connection === 'connecting') {
      console.log('🔄 Connecting to WhatsApp...');
    }
  });

  // Save credentials
  sock.ev.on('creds.update', saveCreds);

  // Status listener for auto-viewing
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (automations.statusView) {
      for (const msg of messages) {
        // Check if it's a status update
        if (msg.key.remoteJid === 'status@broadcast') {
          try {
            console.log(`📱 Status update detected`);
            // Mark status as viewed
            await sock.readMessages([msg.key]);
            console.log(`✅ Auto-viewed status`);
          } catch (error) {
            // Status viewing might fail silently
          }
        }
      }
    }
  });

  // Message handler with better logging
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`📥 Received ${type} message batch with ${messages.length} messages`);
    
    try {
      for (const msg of messages) {
        try {
          console.log('📨 Processing message:', JSON.stringify(msg.key, null, 2));
          
          if (msg.key.fromMe) {
            console.log('⚠️ Skipping self message');
            continue;
          }
          
          if (!msg.message) {
            console.log('⚠️ No message content (might be media/system message)');
            continue;
          }

          const chat = msg.key.remoteJid;
          const from = msg.key.participant || msg.key.remoteJid;
          const isGroup = chat.endsWith('@g.us');

          // Detect media type
          const mediaType = detectMediaType(msg);
          if (mediaType) {
            console.log(`📎 Media detected:`, {
              type: mediaType.type,
              mime: mediaType.mime,
              isVoice: mediaType.isVoice || false,
              fileName: mediaType.fileName || mediaType.type,
              seconds: mediaType.seconds || 0
            });
            
            // Get media info with buffer
            try {
              const mediaInfo = await getMediaInfo(msg, sock);
              if (mediaInfo && mediaInfo.buffer) {
                console.log(`✅ Media downloaded: ${(mediaInfo.size / 1024).toFixed(2)} KB`);
              }
            } catch (err) {
              console.error('❌ Error downloading media:', err.message);
            }
            
            // Send acknowledgment for media
            await sock.sendMessage(chat, {
              text: `✅ Received ${mediaType.type}!${mediaType.isVoice ? ' 🎤 Voice message' : ''}\n📎 Type: ${mediaType.mime}${mediaType.seconds ? `\n⏱️ Duration: ${mediaType.seconds}s` : ''}`
            });
            
            continue;
          }

          const text = msg.message?.conversation || 
                      msg.message?.extendedTextMessage?.text || 
                      msg.message?.imageMessage?.caption || 
                      msg.message?.videoMessage?.caption ||
                      '';
          
          console.log(`📝 Message text: "${text}"`);
          
          // Skip if no text content
          if (!text || text.trim() === '') {
            console.log('⚠️ Empty text, skipping');
            continue;
          }

          console.log(`\n📨 Message from ${from.substring(0, 20)}...`);
          console.log(`💬 Text: ${text.substring(0, 100)}`);
          console.log(`📍 Chat: ${chat}`);
          console.log(`👥 Group: ${isGroup}\n`);

          // Initialize user
          if (!db.users[from]) {
            db.users[from] = { exp: 0, limit: 100 };
          }

          // Command handler
          const prefix = process.env.PREFIX || '.';
          if (text.startsWith(prefix)) {
            const cmd = text.slice(prefix.length).split(' ')[0].toLowerCase().trim();
            const args = text.slice(prefix.length + cmd.length).trim().split(' ');
            
            console.log(`⚡ Command: ${cmd} | Args: ${args.length} | Group: ${isGroup}`);
            
            // Find and execute plugin
            let commandFound = false;
            for (const [name, plugin] of plugins) {
              const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
              if (commands.includes(cmd)) {
                commandFound = true;
                console.log(`🎯 Executing plugin: ${name}`);
                try {
                  await plugin(msg, sock, { from, chat, text, args, cmd, isGroup, prefix, automations });
                  console.log(`✅ Successfully executed: ${name}\n`);
                } catch (err) {
                  console.error(`❌ Error executing ${name}:`, err.message);
                  await sock.sendMessage(chat, { text: '❌ Error executing command. Please try again.' });
                }
                return;
              }
            }

            // Default commands if not found in plugins
            if (!commandFound) {
              console.log('🔄 Executing default command...');
              if (cmd === 'menu' || cmd === 'help') {
                const menu = `🤖 *WASI-MD BOT*\n\n📋 *Available Commands:*\n• .menu / .help - Show this menu\n• .ping - Check bot status\n• .sticker - Convert image to sticker\n• .info - Bot information\n\n*Version:* 1.0.0`;
                await sock.sendMessage(chat, { text: menu });
                console.log('✅ Sent menu\n');
              } else if (cmd === 'ping') {
                await sock.sendMessage(chat, { text: '🏓 Pong! Bot is alive!' });
                console.log('✅ Sent pong\n');
              } else if (cmd === 'info') {
                const info = `📊 *Bot Information:*\n• Name: WASI-MD\n• Status: Online ✓\n• Mode: Multi-Device`;
                await sock.sendMessage(chat, { text: info });
                console.log('✅ Sent info\n');
              } else {
                await sock.sendMessage(chat, { text: `❌ Command not found. Type .menu to see available commands.` });
                console.log('❌ Command not found\n');
              }
            }
          } else {
            console.log('ℹ️ Not a command (doesn\'t start with prefix)\n');
          }
        } catch (err) {
          console.error('❌ Error processing message:', err);
        }
      }
    } catch (err) {
      console.error('❌ Error in message handler:', err);
    }
  });

  // Log when bot is listening
  console.log('👂 Message listener active...');

  return sock;
}

// Start server
app.get('/', (req, res) => {
  res.json({ status: 'Bot is running', name: 'WASI-MD', version: '1.0.0' });
});

app.listen(3000, () => {
  console.log('🌐 Web server running on http://localhost:3000');
});

// Initialize bot
async function initialize() {
  console.log('🚀 Starting WASI-MD Bot...');
  
  // Check for session_base64 in config
  if (config.sessionBase64 && config.sessionBase64.length > 0) {
    console.log('📦 Found Session Base64, restoring session...');
    const success = await saveSessionFromBase64(config.sessionBase64);
    if (success) {
      console.log('✅ Session restored from Base64');
    } else {
      console.log('⚠️ Failed to restore session, will use QR code');
    }
  }
  
  // Load plugins
  await loadPlugins();
  
  // Start bot
  startSock();
}

// Start bot
initialize();
