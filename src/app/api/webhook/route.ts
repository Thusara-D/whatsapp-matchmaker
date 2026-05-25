import { NextResponse } from 'next/server';
import { processIncomingMessage } from '@/lib/messageProcessor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it's the expected simulated webhook payload
    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        const from = message.from; 
        const msgBody = message.text?.body || "";
        const msgType = message.type;

        let base64Image: string | null = null;
        if (msgType === 'image') {
          base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD"; // dummy for simulator
        }

        // The simulator doesn't strictly need a functional sendReply callback 
        // since it reads the chat history directly from Firestore to display responses.
        // However, we provide a mock callback just in case.
        const mockSendReply = async (to: string, text: string) => {
           console.log(`[Simulator Webhook] Simulated reply to ${to}: ${text}`);
        };

        await processIncomingMessage(from, msgBody, base64Image, mockSendReply);
    }
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error: any) {
    console.error('Error handling webhook POST:', error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
