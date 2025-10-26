import fetch from 'node-fetch';

const handler = async (m, sock, { from, chat, args, isGroup }) => {
  if (!args[0]) {
    return await sock.sendMessage(chat, { 
      text: '❌ Please provide a URL\n📝 Usage: .api <url>\n\nExample: .api https://api.github.com/users/octocat' 
    });
  }

  const url = args[0];
  
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    return await sock.sendMessage(chat, { text: '❌ Invalid URL provided' });
  }

  try {
    await sock.sendMessage(chat, { text: '⏳ Fetching data from API...' });
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Format JSON nicely
    const formattedData = JSON.stringify(data, null, 2);
    
    // Send response (WhatsApp has message length limit, so we split if too long)
    if (formattedData.length > 3500) {
      const chunks = formattedData.match(/.{1,3500}/g);
      for (const chunk of chunks) {
        await sock.sendMessage(chat, { text: `\`\`\`json\n${chunk}\n\`\`\`` });
      }
    } else {
      await sock.sendMessage(chat, { 
        text: `📡 *API Response:*\n\n\`\`\`json\n${formattedData}\n\`\`\`` 
      });
    }
    
    await sock.sendMessage(chat, { 
      text: `✅ Status: ${response.status} ${response.statusText}\n🔗 URL: ${url}` 
    });
    
  } catch (error) {
    await sock.sendMessage(chat, { 
      text: `❌ Error fetching API:\n${error.message}` 
    });
  }
};

handler.command = ['api', 'fetch'];
handler.tags = ['tools'];
handler.help = 'Fetch data from any API URL';

export default handler;
