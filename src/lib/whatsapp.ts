import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Adds a message to the Firebase 'outbox' collection.
 * The Baileys WhatsApp bot (running on a separate service) listens to this collection
 * and sends the messages securely.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
    try {
        await addDoc(collection(db, 'outbox'), {
            to,
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
        await addDoc(collection(db, 'outbox'), {
            to,
            imageUrl,
            createdAt: serverTimestamp(),
            status: 'pending'
        });
    } catch (error) {
        console.error("Firebase outbox send image error:", error);
    }
}
