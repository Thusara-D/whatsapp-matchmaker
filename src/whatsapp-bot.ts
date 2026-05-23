import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import * as dotenv from 'dotenv';
import { processIncomingMessage } from './lib/messageProcessor';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // We will handle QR printing with qrcode-terminal for better clarity
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\nScan this QR code with your WhatsApp app to connect:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            // Reconnect if not logged out
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                console.log('You are logged out. Please delete the auth_info_baileys folder and restart to generate a new QR code.');
            }
        } else if (connection === 'open') {
            console.log('\n✅ WhatsApp Connected Successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        
        if (!msg.message || msg.key.fromMe) return; // Ignore empty or self messages
        
        // Ignore group messages (broadcast status is "status@broadcast")
        if (msg.key.remoteJid?.includes('@g.us') || msg.key.remoteJid === 'status@broadcast') return;

        const from = msg.key.remoteJid;
        if (!from) return;

        // Extract text body
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        
        // Extract image if present
        const hasImage = !!msg.message.imageMessage;

        // Ignore empty messages unless it's an image
        if (!textMessage.trim() && !hasImage) return;

        console.log(`[Baileys] Received message from ${from}: ${textMessage} (Has Image: ${hasImage})`);

        // Send reply callback using Baileys socket
        const sendReply = async (to: string, text: string) => {
            await sock.sendMessage(to, { text });
        };

        // Pass to our central message processor
        await processIncomingMessage(from, textMessage, hasImage, sendReply);
    });
}

console.log("Starting Baileys WhatsApp Bot...");
connectToWhatsApp();
