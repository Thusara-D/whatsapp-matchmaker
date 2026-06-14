/**
 * This is an Inter-Process Communication (IPC) helper.
 * Since Next.js and the Baileys WhatsApp bot run in two different Node processes,
 * we use a simple local HTTP request to ask the bot to send a message.
 */
export async function sendWhatsAppMessage(to: string, text: string) {
    try {
        await fetch((process.env.BOT_API_URL || 'http://localhost:3001') + '/send', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-secret': process.env.BOT_API_SECRET || ''
            },
            body: JSON.stringify({ to, text })
        });
    } catch (error) {
        console.error("IPC send error (is the bot running?):", error);
    }
}

export async function sendWhatsAppImage(to: string, imageUrl: string) {
    try {
        await fetch((process.env.BOT_API_URL || 'http://localhost:3001') + '/send', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-secret': process.env.BOT_API_SECRET || ''
            },
            body: JSON.stringify({ to, imageUrl })
        });
    } catch (error) {
        console.error("IPC send image error:", error);
    }
}
