// Configuration for WASI-MD
export const config = {
  // Bot Settings
  botName: process.env.BOT_NAME || 'WASI-MD',
  ownerNumber: process.env.OWNER_NUMBER || '',
  prefix: process.env.PREFIX || '.',
  
  // Session Settings
  sessionName: process.env.SESSION_NAME || 'session',
  pairingCode: process.env.PAIRING_CODE || '',
  sessionId: process.env.SESSION_ID || '',
  sessionBase64: process.env.SESSION_BASE64 || '',
  
  // Server Settings
  port: process.env.PORT || 3000,
  
  // Features
  autoRead: process.env.AUTO_READ === 'true',
  autoTyping: process.env.AUTO_TYPING === 'true',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Export for direct access
export default config;
