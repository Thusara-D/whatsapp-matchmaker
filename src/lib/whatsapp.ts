import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Adds a message to the Firebase 'outbox' collection.
 * The Baileys WhatsApp bot (running on a separate service) listens to this collection
 * and sends the messages securely.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await addDoc(collection(db, 'outbox'), {
            to: jid,
            text,
            createdAt: serverTimestamp(),
            status: 'pending'
        });
    } catch (error) {
        console.error("Firebase outbox send text error:", error);
    }
}

export async function sendWhatsAppImage(to: string, imageUrl: string) {
    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await addDoc(collection(db, 'outbox'), {
            to: jid,
            imageUrl,
            createdAt: serverTimestamp(),
            status: 'pending'
        });
    } catch (error) {
        console.error("Firebase outbox send image error:", error);
    }
}
