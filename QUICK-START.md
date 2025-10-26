# WASI-MD Quick Start Guide 🚀

## ⚡ Quick Start (3 Steps)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Bot
Create `.env` file:
```env
OWNER=your_whatsapp_number
BOT_NAME=WASI-MD
PREFIX=.
PORT=3000
```

### 3️⃣ Start Bot
```bash
npm start
```

**That's it!** Scan the QR code and start chatting with your bot.

---

## 🎯 First Commands to Try

After scanning QR code, send these to your bot:

- `.menu` - Show all available commands
- `.ping` - Check if bot is working
- `.info` - Get bot information
- `.sticker` - Reply to an image to convert to sticker

---

## 📝 Create Your First Plugin

1. Create a new file in `plugins/` folder (e.g., `mytest.js`)
2. Copy this code:

```javascript
const handler = async (m, sock, { from }) => {
  await sock.sendMessage(from, { text: 'Hello! This is my first plugin!' });
};

handler.command = 'hello';
handler.help = 'Say hello to the bot';

export default handler;
```

3. Restart the bot
4. Send `.hello` to your bot

---

## 🎨 Customization Tips

### Change Command Prefix
Edit `index.js`, line ~85:
```javascript
const prefix = '!' // Change from '.' to '!'
```

### Add Owner Check
```javascript
if (cmd === 'adminonly') {
  if (from !== process.env.OWNER) {
    return await sock.sendMessage(from, { text: '❌ Owner only!' });
  }
  // Your code here
}
```

### Send Media
```javascript
await sock.sendMessage(from, {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'This is a caption'
});
```

---

## 🐛 Troubleshooting

### Bot not responding?
- Check if QR code is scanned
- Verify bot is connected (should see "✅ Bot connected successfully")
- Check console for errors

### Commands not working?
- Make sure you're using correct prefix (default is `.`)
- Check plugin file is in `plugins/` folder
- Restart bot after adding new plugin

### Port already in use?
Change port in `.env` file:
```env
PORT=3001
```

---

## 📚 Need More Help?

- Check `WASI-MD-SETUP.md` for detailed setup
- Read Baileys docs: https://github.com/WhiskeySockets/Baileys
- Look at examples in `plugins/_example.js`

---

## 🎉 You're All Set!

Your WASI-MD bot is ready to use. Have fun building amazing features! 🚀
