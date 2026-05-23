/**
 * This is an Inter-Process Communication (IPC) helper.
 * Since Next.js and the Baileys WhatsApp bot run in two different Node processes,
 * we use a simple local HTTP request to ask the bot to send a message.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
    try {
        await fetch('http://localhost:3001/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, text })
        });
    } catch (error) {
        console.error("IPC send error (is the bot running?):", error);
    }
}
