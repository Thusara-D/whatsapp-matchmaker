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
        let base64Image: string | null = null;
        
        if (hasImage) {
            try {
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    { },
                    { logger: undefined as any, reuploadRequest: sock.updateMediaMessage }
                ) as Buffer;
                base64Image = buffer.toString('base64');
            } catch (err) {
                console.error("Error downloading image from WhatsApp:", err);
            }
        }

        // Ignore empty messages unless it's an image
        if (!textMessage.trim() && !hasImage) return;

        console.log(`[Baileys] Received message from ${from}: ${textMessage} (Has Image: ${hasImage})`);

        // Send reply callback using Baileys socket
        const sendReply = async (to: string, text: string) => {
            // Simulate human typing delay
            console.log(`[Baileys] Simulating typing for 5 seconds to ${to}...`);
            await sock.sendPresenceUpdate('composing', to);
            
            // Wait for 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Clear typing status (usually automatic, but good practice)
            await sock.sendPresenceUpdate('paused', to);
            
            // Send the actual message
            await sock.sendMessage(to, { text });
        };

        // Pass to our central message processor
        await processIncomingMessage(from, textMessage, base64Image, sendReply);
    });

    // --- IPC Server ---
    // Start a tiny local HTTP server so the Next.js frontend (e.g. the Payments Approval page)
    // can ask this standalone bot process to send a WhatsApp message.
    const http = await import('http');
    const server = http.createServer((req, res) => {
        if (req.url === '/send' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const { to, text } = JSON.parse(body);
                    await sock.sendMessage(to, { text });
                    res.writeHead(200);
                    res.end('OK');
                } catch (e: any) {
                    res.writeHead(500);
                    res.end(e.toString());
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });
    server.listen(3001, () => {
        console.log('\n[IPC] Local server listening on port 3001 for Next.js requests.');
    });
}

console.log("Starting Baileys WhatsApp Bot...");
connectToWhatsApp();
