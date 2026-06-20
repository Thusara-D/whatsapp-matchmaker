import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { generateRejectionTransitionMessage } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();

    // Generate the message
    const rejectionMsg = await generateRejectionTransitionMessage(userData.chatHistory || "", userData.currentMatches || []);
    
    // Update data
    userData.status = 'MATCHES_SENT';
    userData.selectedMatchId = null; // Clear their pending selection if any
    userData.chatHistory += `\nBot: ${rejectionMsg}`;
    
    await setDoc(userRef, userData, { merge: true });
    await sendWhatsAppMessage(userId, rejectionMsg);

    return NextResponse.json({ success: true, messageSent: rejectionMsg });
  } catch (error) {
    console.error('Error in send-rejection-options route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
