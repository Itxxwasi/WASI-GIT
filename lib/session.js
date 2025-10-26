import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate pairing code and session information
 */
export async function getSessionInfo() {
  const sessionDir = path.join(__dirname, '..', 'session');
  
  try {
    const files = await fs.readdir(sessionDir);
    const credsPath = path.join(sessionDir, 'creds.json');
    
    let sessionId = '';
    let sessionBase64 = '';
    
    // Check if creds.json exists
    if (files.includes('creds.json')) {
      try {
        const credsData = await fs.readFile(credsPath, 'utf8');
        const creds = JSON.parse(credsData);
        
        // Generate session ID from creds
        sessionId = Buffer.from(JSON.stringify(creds)).toString('base64');
        
        // Create complete session data
        const sessionData = {
          creds,
          keys: {},
          store: {}
        };
        
        // Convert to base64
        sessionBase64 = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      } catch (err) {
        console.error('Error reading creds:', err.message);
      }
    }
    
    return {
      sessionId,
      sessionBase64,
      hasSession: sessionBase64.length > 0
    };
  } catch (err) {
    return {
      sessionId: '',
      sessionBase64: '',
      hasSession: false
    };
  }
}

/**
 * Save session from Base64
 */
export async function saveSessionFromBase64(base64Data) {
  try {
    // Decode base64
    const sessionData = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));
    
    const sessionDir = path.join(__dirname, '..', 'session');
    await fs.mkdir(sessionDir, { recursive: true });
    
    // Save creds
    if (sessionData.creds) {
      await fs.writeFile(
        path.join(sessionDir, 'creds.json'),
        JSON.stringify(sessionData.creds, null, 2)
      );
    }
    
    // Save keys
    if (sessionData.keys) {
      for (const [key, value] of Object.entries(sessionData.keys)) {
        await fs.writeFile(
          path.join(sessionDir, `${key}.json`),
          JSON.stringify(value, null, 2)
        );
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error saving session:', err.message);
    return false;
  }
}

/**
 * Get pairing code for QR-less connection
 */
export function generatePairingCode() {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate pairing code format
 */
export function isValidPairingCode(code) {
  return /^\d{6}$/.test(code);
}

/**
 * Get connection method (qr, pairing_code, session)
 */
export function getConnectionMethod(sessionId, sessionBase64, pairingCode) {
  if (sessionBase64 && sessionBase64.length > 0) {
    return 'session_base64';
  }
  if (sessionId && sessionId.length > 0) {
    return 'session_id';
  }
  if (pairingCode && pairingCode.length > 0) {
    return 'pairing_code';
  }
  return 'qr';
}
