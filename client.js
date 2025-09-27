const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { getIntent } = require('./intent.js');

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    try {
        const intentResponse = await getIntent(msg.body);
        console.log('Intent response:', intentResponse);
        
        // Parse the JSON response and handle accordingly
        const intent = JSON.parse(intentResponse);
        
        if (intent.message) {
            console.log('Sending message:\n', intent.message);
            // msg.reply(intent.message);
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

client.initialize();