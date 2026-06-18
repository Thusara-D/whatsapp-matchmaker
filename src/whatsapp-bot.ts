import './env'; // MUST BE FIRST to load .env.local before Firebase initializes
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { processIncomingMessage } from '@/lib/messageProcessor';

// STATIC IMPORTS strictly to bypass tsx/esm resolution mismatches
import { db } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { collection, query, where, onSnapshot, deleteDoc, doc, getFirestore } from 'firebase/firestore';

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

        // Extract real phone number (avoid @lid if possible)
        let from = msg.key.remoteJid;
        if (from?.includes('@lid')) {
            // Baileys sometimes provides the real phone number in alternate fields when using LIDs
            from = msg.key.remoteJidAlt || msg.key.participantAlt || msg.key.participant || from;
        }
        
        if (!from) return;

        // Extract text body
        const textMessage = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        
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

    // --- Firebase Outbox Listener ---
    // Instead of a local HTTP server, we listen to the 'outbox' collection in Firestore.
    // This allows the bot to securely receive messages from Next.js deployed anywhere (e.g. Railway)
    console.log("[DEBUG] NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "EXISTS" : "MISSING");
    
    // Fallback: If `db` is undefined due to TSX/ESM resolution loop, fetch it directly
    const dbInstance = db || getFirestore(getApp());
    console.log("[DEBUG] dbInstance object valid:", !!dbInstance);
    
    if (!dbInstance) {
        throw new Error("CRITICAL: Firebase 'dbInstance' could not be resolved.");
    }

    const q = query(collection(dbInstance, 'outbox'), where('status', '==', 'pending'));
    console.log('\n[Outbox] Listening for outgoing messages from Firebase...');
    
    onSnapshot(q, async (snapshot) => {
        const addedChanges = snapshot.docChanges().filter(change => change.type === 'added');
        if (addedChanges.length === 0) return;

        // Sort by createdAt to ensure correct chronological sending
        addedChanges.sort((a, b) => {
            const timeA = a.doc.data().createdAt?.toMillis?.() || 0;
            const timeB = b.doc.data().createdAt?.toMillis?.() || 0;
            return timeA - timeB;
        });

        for (const change of addedChanges) {
            const data = change.doc.data();
            const docId = change.doc.id;
            
            try {
                const { to: rawTo, text, imageUrl, imagePath } = data;
                const to = rawTo.includes('@') ? rawTo : `${rawTo}@s.whatsapp.net`;
                const imageTarget = imageUrl || imagePath;
                
                if (imageTarget) {
                    if (imageTarget.startsWith('http')) {
                        await sock.sendMessage(to, { image: { url: imageTarget } });
                    } else {
                        const fs = await import('fs');
                        const path = await import('path');
                        const fullPath = path.join(process.cwd(), 'public', imageTarget);
                        if (fs.existsSync(fullPath)) {
                            await sock.sendMessage(to, { image: { url: fullPath } });
                        } else {
                            console.error(`[Outbox] Local image not found, skipping: ${fullPath}`);
                        }
                    }
                } else if (text) {
                    await sock.sendMessage(to, { text });
                }
                
                console.log(`[Outbox] Successfully sent message to ${to}`);
                
                // Delete the document after sending to prevent duplicate sends
                await deleteDoc(doc(dbInstance, 'outbox', docId));
            } catch (err) {
                console.error(`[Outbox] Failed to send message for doc ${docId}:`, err);
            }
        }
    });


    // ... (rest of connectToWhatsApp)
}

// --- Dummy HTTP Server for Railway Health Checks ---
// Railway requires web services to bind to process.env.PORT and respond to HTTP requests.
// We keep this completely outside connectToWhatsApp so it only binds exactly once per process.
const PORT = process.env.PORT || 3001;
import('http').then((http) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running and listening to Firestore Outbox!\n');
    });
    server.listen(PORT, () => {
        console.log(`\n[Health Check] Dummy server listening on port ${PORT} to keep Railway happy.`);
    });
});

console.log("Starting Baileys WhatsApp Bot...");
connectToWhatsApp();
